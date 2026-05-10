import { Database, Tag, Layers, Users } from 'lucide-react';

const stats = [
  { icon: Database, value: '7,909', label: 'Total images' },
  { icon: Tag, value: '2 (Benign / Malignant)', label: 'Classes' },
  { icon: Layers, value: '4 levels', label: 'Magnifications' },
  { icon: Users, value: '82', label: 'Patients' },
];

const magnifications = [
  { mag: '40×', count: 1995, total: 2081 },
  { mag: '100×', count: 2081, total: 2081 },
  { mag: '200×', count: 2013, total: 2081 },
  { mag: '400×', count: 1820, total: 2081 },
];

const magColors = [
  'linear-gradient(90deg, #B8860B, #FF6B00)',
  'linear-gradient(90deg, #FF7A33, #E85D00)',
  'linear-gradient(90deg, #D4A017, #FF8C00)',
  'linear-gradient(90deg, #FF6B00, #B8860B)',
];

const benignSubtypes = ['Adenosis', 'Fibroadenoma', 'Phyllodes Tumor', 'Tubular Adenoma'];
const malignantSubtypes = ['Ductal Carcinoma', 'Lobular Carcinoma', 'Mucinous Carcinoma', 'Papillary Carcinoma'];

export default function Dataset() {
  return (
    <>
      <div className="page-scroll">
        <div className="page-inner">
          <div className="fade-up">
            <div className="page-badge">DATA</div>
            <h1 className="page-title">BreakHis dataset</h1>
            <p className="page-subtitle">
              The Breast Cancer Histopathological Image Classification (BreakHis) dataset:
              microscopic biopsy images of benign and malignant breast tumors collected at four
              magnifications.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="stat-grid stat-grid-4">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <div key={label} className={`stat-card fade-up fade-up-${i + 1}`}>
                <div className="stat-label">
                  <Icon size={15} color="var(--text-muted)" />
                </div>
                <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
                <div className="stat-desc">{label}</div>
              </div>
            ))}
          </div>

          <div className="two-col-equal fade-up fade-up-3">
            {/* Magnification distribution */}
            <div className="card card-pad">
              <div className="chart-card-title">Magnification distribution</div>
              <div style={{ marginTop: 20 }}>
                {magnifications.map(({ mag, count, total }, i) => (
                  <div key={mag} className="dist-bar-row">
                    <div className="dist-bar-header">
                      <span className="dist-bar-label">{mag}</span>
                      <span className="dist-bar-count">{count.toLocaleString()} images</span>
                    </div>
                    <div className="dist-track">
                      <div
                        className="dist-fill"
                        style={{
                          width: `${(count / total) * 100}%`,
                          background: magColors[i],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tumor subtypes */}
            <div className="card card-pad">
              <div className="chart-card-title">Tumor subtypes</div>
              <div style={{ marginTop: 20 }}>
                <div className="subtype-label">
                  <span className="subtype-dot" style={{ background: '#22c55e' }} />
                  Benign
                </div>
                <div className="tag-wrap">
                  {benignSubtypes.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
                <div className="subtype-label" style={{ marginTop: 8 }}>
                  <span className="subtype-dot" style={{ background: '#ef4444' }} />
                  Malignant
                </div>
                <div className="tag-wrap">
                  {malignantSubtypes.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Acquisition */}
          <div className="card card-pad fade-up fade-up-4" style={{ marginTop: 16 }}>
            <div className="chart-card-title" style={{ marginBottom: 12 }}>Acquisition</div>
            <p className="acquisition-text">
              Slides were stained with hematoxylin and eosin (H&amp;E) and digitized using a digital
              camera mounted on an optical microscope. Each sample is provided at 40×, 100×, 200×, and
              400× magnifications, giving multi-scale views of the same tissue region — the basis for our
              scale-aware embedding.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
