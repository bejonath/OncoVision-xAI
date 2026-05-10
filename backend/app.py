import base64
import io
import os
from functools import lru_cache
from typing import Tuple

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from tensorflow import keras
from tensorflow.keras import layers

MODEL_PATH = os.getenv("MODEL_PATH", "balanced_hybrid1.h5")
IMG_SIZE = int(os.getenv("IMG_SIZE", "224"))
FUSION_IG_STEPS = int(os.getenv("FUSION_IG_STEPS", "32"))
ENABLE_FUSION_XAI = os.getenv("ENABLE_FUSION_XAI", "true").lower() in {"1", "true", "yes"}

# Architecture hyperparameters used in the notebook fallback model build.
PATCH_SIZE = 16
EMBED_DIM = 256
NUM_HEADS = 8
MLP_RATIO = 3
DROPOUT = 0.25
VIT_DEPTH = 6
NUM_CLASSES = 1


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    gradcam_image: str
    fusion_ig_image: str
    gradcam_map_image: str | None = None
    fusion_ig_map_image: str | None = None


def add_positional_embeddings(x: tf.Tensor, num_tokens: int, embed_dim: int) -> tf.Tensor:
    positions = tf.range(start=0, limit=num_tokens, delta=1)
    pos_embed = layers.Embedding(input_dim=num_tokens, output_dim=embed_dim)(positions)
    pos_embed = tf.expand_dims(pos_embed, axis=0)
    return x + pos_embed


def patch_embedding(inputs: tf.Tensor) -> tf.Tensor:
    x = layers.Conv2D(EMBED_DIM, kernel_size=PATCH_SIZE, strides=PATCH_SIZE)(inputs)
    x = layers.Reshape((-1, EMBED_DIM))(x)
    num_patches = (IMG_SIZE // PATCH_SIZE) ** 2
    x = add_positional_embeddings(x, num_patches, EMBED_DIM)
    return x


def transformer_block(x: tf.Tensor) -> tf.Tensor:
    x1 = layers.LayerNormalization(epsilon=1e-6)(x)
    attn = layers.MultiHeadAttention(
        num_heads=NUM_HEADS,
        key_dim=EMBED_DIM // NUM_HEADS,
        dropout=DROPOUT,
    )(x1, x1)
    x = x + attn

    x1 = layers.LayerNormalization(epsilon=1e-6)(x)
    mlp = layers.Dense(EMBED_DIM * MLP_RATIO, activation="gelu")(x1)
    mlp = layers.Dropout(DROPOUT)(mlp)
    mlp = layers.Dense(EMBED_DIM)(mlp)
    mlp = layers.Dropout(DROPOUT)(mlp)
    return x + mlp


def vit_encoder(inputs: tf.Tensor) -> tf.Tensor:
    x = patch_embedding(inputs)
    x = layers.Dropout(DROPOUT)(x)
    for _ in range(VIT_DEPTH):
        x = transformer_block(x)
    return layers.LayerNormalization(epsilon=1e-6)(x)


def cnn_backbone(inputs: tf.Tensor) -> Tuple[keras.Model, tf.Tensor]:
    # Avoid network downloads in fallback builds; direct full-model load is preferred.
    base = keras.applications.ResNet50(include_top=False, weights=None, input_tensor=inputs)
    base.trainable = False

    x = base.output
    x = layers.Conv2D(EMBED_DIM, 1, activation="gelu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Reshape((-1, EMBED_DIM))(x)

    num_tokens = (IMG_SIZE // 32) ** 2
    x = add_positional_embeddings(x, num_tokens, EMBED_DIM)
    return base, x


def cross_attention_fusion(cnn_tokens: tf.Tensor, vit_tokens: tf.Tensor) -> tf.Tensor:
    cross_attn = layers.MultiHeadAttention(
        num_heads=8,
        key_dim=EMBED_DIM // 8,
        dropout=DROPOUT,
    )
    attn_output = cross_attn(query=vit_tokens, key=cnn_tokens, value=cnn_tokens)
    fused = vit_tokens + attn_output
    return layers.LayerNormalization()(fused)


def build_model() -> keras.Model:
    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))

    vit_inputs = layers.Rescaling(2.0, offset=-1.0)(inputs)
    cnn_inputs = layers.Lambda(lambda t: tf.keras.applications.resnet50.preprocess_input(t * 255.0))(inputs)

    _base, cnn_tokens = cnn_backbone(cnn_inputs)
    vit_tokens = vit_encoder(vit_inputs)
    fused = cross_attention_fusion(cnn_tokens, vit_tokens)

    pooled = layers.GlobalAveragePooling1D()(fused)
    x = layers.Dense(256, activation="gelu")(pooled)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="gelu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="sigmoid")(x)

    return keras.Model(inputs, outputs, name="Hybrid_CNN_ViT")


def load_hybrid_model(model_path: str) -> keras.Model:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    try:
        return tf.keras.models.load_model(model_path, compile=False)
    except Exception:
        model = build_model()
        try:
            model.load_weights(model_path)
        except Exception:
            model.load_weights(model_path, by_name=True, skip_mismatch=True)
        return model


def image_bytes_to_tensor(raw: bytes, image_size: int = IMG_SIZE) -> tuple[np.ndarray, np.ndarray]:
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        img = img.resize((image_size, image_size), Image.Resampling.BILINEAR)
        arr = np.asarray(img).astype("float32") / 255.0
    return np.expand_dims(arr, axis=0), arr


def overlay_heatmap(image_01: np.ndarray, heatmap_01: np.ndarray, alpha: float = 0.45, cmap: str = "jet") -> np.ndarray:
    heatmap_01 = np.clip(heatmap_01, 0.0, 1.0)
    color_map = plt.get_cmap(cmap)(heatmap_01)[..., :3]
    return np.clip((1.0 - alpha) * image_01 + alpha * color_map, 0.0, 1.0)


def normalize_map(x: np.ndarray) -> np.ndarray:
    return (x - x.min()) / (x.max() - x.min() + 1e-8)


def find_last_conv2d_layer(model: keras.Model) -> str:
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    raise ValueError("No Conv2D layer found for Grad-CAM.")


def make_gradcam_heatmap(model: keras.Model, img_tensor: np.ndarray, conv_layer_name: str) -> np.ndarray:
    conv_layer = model.get_layer(conv_layer_name)
    grad_model = tf.keras.Model(inputs=model.inputs, outputs=[conv_layer.output, model.output])

    with tf.GradientTape() as tape:
        conv_out, preds = grad_model(img_tensor, training=False)
        target = preds[:, 0]

    grads = tape.gradient(target, conv_out)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_out = conv_out[0]

    heatmap = tf.reduce_sum(conv_out * pooled_grads[tf.newaxis, tf.newaxis, :], axis=-1)
    heatmap = tf.nn.relu(heatmap)
    heatmap = heatmap / (tf.reduce_max(heatmap) + 1e-8)
    heatmap = tf.image.resize(heatmap[..., tf.newaxis], (IMG_SIZE, IMG_SIZE)).numpy()[..., 0]
    return heatmap


def find_fused_token_tensor(model: keras.Model) -> tf.Tensor:
    gap_layers = [l for l in model.layers if isinstance(l, tf.keras.layers.GlobalAveragePooling1D)]
    if not gap_layers:
        raise ValueError("No GlobalAveragePooling1D layer found to extract fused tokens.")
    return gap_layers[-1].input


def build_fusion_ig_models(model: keras.Model) -> tuple[keras.Model, keras.Model]:
    fused_tokens = find_fused_token_tensor(model)
    probe_model = tf.keras.Model(model.input, fused_tokens, name="fusion_ig_probe")
    tail_model = tf.keras.Model(fused_tokens, model.output, name="fusion_ig_tail")
    return probe_model, tail_model


def integrated_gradients_tokens(tail_model: keras.Model, tokens: tf.Tensor, steps: int = FUSION_IG_STEPS) -> np.ndarray:
    tokens = tf.convert_to_tensor(tokens, dtype=tf.float32)
    baseline = tf.zeros_like(tokens)

    alphas = tf.linspace(0.0, 1.0, steps + 1)
    total_grads = tf.zeros_like(tokens)

    for alpha in alphas:
        x = baseline + alpha * (tokens - baseline)
        with tf.GradientTape() as tape:
            tape.watch(x)
            preds = tail_model(x, training=False)
            target = preds[:, 0]
        grads = tape.gradient(target, x)
        total_grads += grads

    avg_grads = total_grads / tf.cast(steps + 1, tf.float32)
    ig = (tokens - baseline) * avg_grads
    token_scores = tf.reduce_sum(tf.abs(ig), axis=-1)[0].numpy()
    return normalize_map(token_scores)


def tokens_to_image_heatmap(token_scores: np.ndarray, image_size: int = IMG_SIZE) -> np.ndarray:
    n_tokens = token_scores.shape[0]
    grid = int(np.sqrt(n_tokens))
    if grid * grid != n_tokens:
        raise ValueError(f"Token count {n_tokens} is not a square.")

    m = token_scores.reshape(grid, grid)
    m = tf.image.resize(m[np.newaxis, ..., np.newaxis], (image_size, image_size)).numpy()[0, ..., 0]
    return normalize_map(m)


def array_to_base64_png(image_01: np.ndarray) -> str:
    image_u8 = (np.clip(image_01, 0.0, 1.0) * 255.0).astype(np.uint8)
    pil_img = Image.fromarray(image_u8)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@lru_cache(maxsize=1)
def get_runtime() -> dict:
    model = load_hybrid_model(MODEL_PATH)
    conv_name = find_last_conv2d_layer(model)

    fusion_probe = None
    fusion_tail = None
    if ENABLE_FUSION_XAI:
        fusion_probe, fusion_tail = build_fusion_ig_models(model)

    return {
        "model": model,
        "conv_name": conv_name,
        "fusion_probe": fusion_probe,
        "fusion_tail": fusion_tail,
    }


app = FastAPI(title="OncoVision XAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    try:
        runtime = get_runtime()
        model = runtime["model"]
        return {
            "status": "ok",
            "model_path": MODEL_PATH,
            "model_name": model.name,
            "fusion_xai_enabled": ENABLE_FUSION_XAI,
        }
    except Exception as exc:
        return {
            "status": "error",
            "model_path": MODEL_PATH,
            "error": str(exc),
        }


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)) -> PredictionResponse:
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only PNG/JPEG images are supported.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        img_tensor, img_01 = image_bytes_to_tensor(raw, image_size=IMG_SIZE)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc

    runtime = get_runtime()
    model: keras.Model = runtime["model"]
    conv_name: str = runtime["conv_name"]

    pred = float(model(img_tensor, training=False)[0, 0].numpy())
    label = "malignant" if pred >= 0.5 else "benign"

    gradcam_map = make_gradcam_heatmap(model, img_tensor, conv_name)
    gradcam_overlay = overlay_heatmap(img_01, gradcam_map, alpha=0.45, cmap="jet")

    fusion_overlay = np.copy(img_01)
    fusion_map = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.float32)

    if ENABLE_FUSION_XAI and runtime["fusion_probe"] is not None and runtime["fusion_tail"] is not None:
        fused_tokens = runtime["fusion_probe"](img_tensor, training=False)
        fusion_token_scores = integrated_gradients_tokens(runtime["fusion_tail"], fused_tokens, steps=FUSION_IG_STEPS)
        fusion_map = tokens_to_image_heatmap(fusion_token_scores, image_size=IMG_SIZE)
        fusion_overlay = overlay_heatmap(img_01, fusion_map, alpha=0.45, cmap="magma")

    return PredictionResponse(
        prediction=label,
        confidence=pred if label == "malignant" else 1.0 - pred,
        gradcam_image=array_to_base64_png(gradcam_overlay),
        fusion_ig_image=array_to_base64_png(fusion_overlay),
        gradcam_map_image=array_to_base64_png(np.stack([gradcam_map] * 3, axis=-1)),
        fusion_ig_map_image=array_to_base64_png(np.stack([fusion_map] * 3, axis=-1)),
    )
