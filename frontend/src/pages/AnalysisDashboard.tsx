import { useRef, useState, useCallback } from 'react';
import { Upload, FlaskConical, AlertCircle, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';

const ZoomableImage = ({ src, alt }: { src: string; alt: string }) => {
  const [zoom, setZoom] = useState(1);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'scale-down', transform: `scale(${zoom})`, transition: 'transform 0.2s var(--ease)', transformOrigin: 'center' }} />
      <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.25)); }} className="topbar-icon-btn" style={{ width: 28, height: 28 }} title="Zoom Out">
          <ZoomOut size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(4, z + 0.25)); }} className="topbar-icon-btn" style={{ width: 28, height: 28 }} title="Zoom In">
          <ZoomIn size={14} />
        </button>
      </div>
    </div>
  );
};

export default function AnalysisDashboard() {
  const { file, previewUrl, status, result, error, setFile, analyze, reset } = useAnalysisStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) {
      alert('Please upload a PNG or JPEG image.');
      return;
    }
    setFile(f);
  }, [setFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const confidence = result ? Math.round(result.confidence * 100) : 0;

  return (
    <>
      <div className="page-scroll">
        <div className="page-inner">
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div className="fade-up">
              <h1 className="page-title">Analysis Dashboard</h1>
              <p className="page-subtitle">
                Upload digitized H&amp;E stained histopathology images for automated malignancy
                prediction and region-of-interest highlighting.
              </p>
            </div>
            <div className="fade-up fade-up-1" style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                SYSTEM STATUS
              </div>
              <div className="status-online">
                <span className="status-dot" />
                Model V3.1 Online
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            className={`upload-zone fade-up fade-up-2${dragging ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            <div className="upload-icon-wrap">
              <Upload size={22} color="#fff" />
            </div>
            <div className="upload-title">Upload histopathology image</div>
            <div className="upload-hint">
              Drag &amp; drop or <a onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>browse</a>
              &nbsp;— JPEG / PNG up to 25 MB
            </div>
          </div>

          {/* Specimen + Results */}
          <div className="two-col fade-up fade-up-3">
            {/* Specimen View */}
            <div className="card card-pad">
              <div className="section-card-title">Specimen View</div>
              <div className="image-placeholder" style={{ height: 340 }}>
                {previewUrl
                  ? <ZoomableImage src={previewUrl} alt="Uploaded specimen" />
                  : <span>Upload an image to see the specimen view</span>
                }
              </div>
            </div>

            {/* Analysis Results */}
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="section-card-title">
                <FlaskConical size={15} color="var(--orange)" />
                Analysis Results
              </div>

              {status === 'idle' && !result && (
                <div className="result-empty">
                  <span>Upload an image and click <strong>Analyze</strong></span>
                  <span>to see prediction &amp; confidence here.</span>
                </div>
              )}

              {status === 'loading' && (
                <div className="result-empty" style={{ gap: 12 }}>
                  <div className="spinner" />
                  <span style={{ color: 'var(--text-tertiary)' }}>Analysing image…</span>
                </div>
              )}

              {status === 'error' && (
                <div className="result-empty" style={{ color: 'var(--orange-deep)', gap: 8 }}>
                  <AlertCircle size={22} />
                  <span>{error}</span>
                  <button className="btn-secondary" style={{ marginTop: 8 }} onClick={reset}>
                    <RotateCcw size={14} /> Try Again
                  </button>
                </div>
              )}

              {status === 'success' && result && (
                <div className="result-panel">
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prediction</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: result.prediction === 'malignant' ? 'var(--orange-deep)' : '#15803d', marginBottom: 12 }}>
                      {result.prediction.charAt(0).toUpperCase() + result.prediction.slice(1)}
                    </div>
                    <div className="confidence-label" style={{ justifyContent: 'center', gap: 8, fontSize: 14 }}>
                      <span>Confidence Score</span>
                      <span style={{ fontWeight: 800, color: 'var(--orange)', fontSize: 18 }}>{confidence}%</span>
                    </div>
                    <div className="confidence-track" style={{ marginTop: 8, maxWidth: 200, margin: '8px auto 0' }}>
                      <div className="confidence-fill" style={{ width: `${confidence}%` }} />
                    </div>
                  </div>
                  <button className="btn-secondary" onClick={reset} style={{ width: '100%', justifyContent: 'center' }}>
                    <RotateCcw size={14} /> Analyze Another
                  </button>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  disabled={!file || status === 'loading'}
                  onClick={analyze}
                >
                  <FlaskConical size={16} />
                  {status === 'loading' ? 'Analyzing…' : 'Analyze Image'}
                </button>
              </div>
            </div>
          </div>

          {/* Explainability Maps */}
          <div className="xai-section fade-up fade-up-4">
            <div className="xai-section-header">
              <div className="xai-section-title">Explainability Maps</div>
              <div className="xai-section-sub">
                Grad-CAM and <span>Fusion IG</span> are shown side by side for direct comparison.
              </div>
            </div>

            <div className="xai-grid">
              {/* Grad-CAM */}
              <div className="xai-card">
                <div className="xai-card-title">Model Explainability (Grad-CAM)</div>
                <div className="xai-card-desc">
                  CNN class-activation map highlighting regions that drove the convolutional features.
                </div>
                <div className="xai-image-area">
                  {result?.gradcam_image
                    ? <ZoomableImage src={`data:image/png;base64,${result.gradcam_image}`} alt="Grad-CAM overlay" />
                    : <span>Awaiting analysis</span>
                  }
                </div>
                <div className="attention-bar-label">
                  <span>Low Importance</span>
                  <span>High Importance</span>
                </div>
                <div className="attention-track" />
                <div className="xai-note">
                  <div className="xai-note-dot" />
                  <span>
                    The model focuses on densely packed nuclear regions. High intensity (red) correlates with
                    irregular cell morphology typical of invasive structures.
                  </span>
                </div>
              </div>

              {/* Fusion IG */}
              <div className="xai-card">
                <div className="xai-card-title">Fusion Integrated Gradients</div>
                <div className="xai-card-desc">
                  IG overlay computed after cross-attention fusion of CNN and ViT branches.
                </div>
                <div className="xai-image-area">
                  {result?.fusion_ig_image
                    ? <ZoomableImage src={`data:image/png;base64,${result.fusion_ig_image}`} alt="Fusion IG overlay" />
                    : <span>Awaiting analysis</span>
                  }
                </div>
                <div className="attention-bar-label">
                  <span>Low Importance</span>
                  <span>High Importance</span>
                </div>
                <div className="attention-track" />
                <div className="xai-note">
                  <div className="xai-note-dot" />
                  <span>
                    Fusion IG attributes contribution to both CNN-local and ViT-global tokens. Hot regions
                    indicate areas where multi-scale evidence agreed on the prediction.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
