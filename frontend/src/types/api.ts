export interface PredictionResponse {
  prediction: 'malignant' | 'benign';
  confidence: number;
  gradcam_image: string;
  fusion_ig_image: string;
  gradcam_map_image: string | null;
  fusion_ig_map_image: string | null;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  model_path: string;
  model_name?: string;
  fusion_xai_enabled?: boolean;
  error?: string;
}
