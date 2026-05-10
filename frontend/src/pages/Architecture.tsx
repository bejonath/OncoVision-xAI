import { Layers, Cpu, Sparkles, ArrowRight, GitMerge, Brain, Eye } from 'lucide-react';

const flowRow1 = [
  { icon: Layers, title: 'Input image', desc: 'H&E histopathology image', highlight: false },
  null, // arrow
  { icon: Cpu, title: 'ResNet50 (CNN)', desc: 'Local convolutional features', highlight: false, teal: true },
  { icon: Brain, title: 'Vision Transformer', desc: 'Global self-attention tokens', highlight: false, purple: true },
  null, // arrow
  { icon: GitMerge, title: 'Cross-attention fusion', desc: 'CNN ↔ ViT token interaction', highlight: true },
];

const flowRow2 = [
  { icon: Layers, title: 'Fused token representation', desc: 'Joint CNN + ViT features', highlight: false },
  null,
  { icon: Cpu, title: 'Hybrid classifier head', desc: 'MLP → Benign / Malignant', highlight: false, teal: true },
  null,
  { icon: Sparkles, title: 'Explainability', desc: 'Grad-CAM (CNN) + IG (Fusion)', highlight: false, purple: true },
];

const features = [
  {
    title: 'Cross-attention fusion',
    desc: 'CNN feature maps and ViT tokens attend to each other through a bidirectional cross-attention block, mixing local texture with global context.',
  },
  {
    title: 'Fused token classifier',
    desc: 'The fused representation is pooled and passed through an MLP head to produce the final benign vs malignant probability.',
  },
  {
    title: 'Hybrid explainability',
    desc: 'Grad-CAM exposes CNN saliency, while Integrated Gradients on the fused representation reveals what drove the final fused decision.',
  },
];

interface FlowNode {
  icon: React.ElementType;
  title: string;
  desc: string;
  highlight: boolean;
  teal?: boolean;
  purple?: boolean;
}

function ArchNode({ node }: { node: FlowNode }) {
  const { icon: Icon, title, desc, highlight, teal, purple } = node;
  let bg = 'var(--surface)';
  let iconColor = 'var(--text-tertiary)';
  let titleColor = 'var(--text-primary)';
  let descColor = 'var(--text-tertiary)';
  let border = '1px solid var(--border)';

  if (highlight) {
    bg = 'var(--gradient-btn)';
    border = 'none';
    iconColor = 'rgba(255,255,255,0.9)';
    titleColor = '#fff';
    descColor = 'rgba(255,255,255,0.75)';
  } else if (teal) {
    bg = 'rgba(255, 107, 0, 0.06)';
    border = '1px solid rgba(255,107,0,0.15)';
    iconColor = 'var(--orange)';
  } else if (purple) {
    bg = 'rgba(184, 134, 11, 0.06)';
    border = '1px solid rgba(184,134,11,0.2)';
    iconColor = 'var(--gold)';
  }

  return (
    <div
      className="arch-node"
      style={{
        background: highlight ? 'linear-gradient(135deg, #FF7A33 0%, #E85D00 100%)' : bg,
        border,
      }}
    >
      <div className="arch-node-icon">
        <Icon size={18} color={iconColor} />
      </div>
      <div className="arch-node-title" style={{ color: titleColor }}>{title}</div>
      <div className="arch-node-desc" style={{ color: descColor }}>{desc}</div>
    </div>
  );
}

export default function Architecture() {
  const renderRow = (row: (FlowNode | null)[]) => {
    const result: React.ReactNode[] = [];
    row.forEach((item, i) => {
      if (item === null) {
        result.push(
          <div key={`arrow-${i}`} className="arch-arrow">
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
        );
      } else {
        result.push(<ArchNode key={item.title} node={item} />);
      }
    });
    return result;
  };

  return (
    <>
      <div className="page-scroll">
        <div className="page-inner">
          <div className="fade-up">
            <div className="page-badge">ARCHITECTURE</div>
            <h1 className="page-title">CNN + ViT cross-attention fusion</h1>
            <p className="page-subtitle">
              A hybrid model combining a convolutional backbone for local texture features and a
              Vision Transformer for long-range context, fused via cross-attention for final
              classification.
            </p>
          </div>

          {/* Architecture Flow */}
          <div className="arch-flow-card fade-up fade-up-2">
            <div className="arch-flow-title">Architecture flow</div>

            {/* Row 1 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 32px 1fr 1fr 32px 1fr',
                gap: '12px',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              {renderRow(flowRow1)}
            </div>

            {/* Row 2 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 32px 1fr 32px 1fr',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              {renderRow(flowRow2)}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="arch-feature-grid fade-up fade-up-3">
            {features.map(({ title, desc }) => (
              <div key={title} className="arch-feature-card">
                <div className="arch-feature-title">{title}</div>
                <div className="arch-feature-desc">{desc}</div>
              </div>
            ))}
          </div>

          {/* Extra detail card */}
          <div className="card card-pad fade-up fade-up-4" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 6 }}>BACKBONE</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ResNet50 (frozen)</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Extracts local spatial features. Output projected to 256-dim token space.</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>TRANSFORMER</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ViT (depth 6, 8 heads)</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Patch size 16, embed dim 256. Captures global tissue structure via self-attention.</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>CLASSIFIER</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>MLP Head (256→128→1)</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sigmoid output. Threshold 0.5 for Benign / Malignant binary classification.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
