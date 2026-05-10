import TopBar from '../components/layout/TopBar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Target, Activity, RefreshCw, ShieldCheck, Divide } from 'lucide-react';

const stats = [
  { icon: Target, label: 'ACCURACY', value: '94.21%', desc: 'Overall classification accuracy' },
  { icon: Activity, label: 'AUC', value: '0.9871', desc: 'Area under ROC curve' },
  { icon: RefreshCw, label: 'SENSITIVITY', value: '96.34%', desc: 'True positive rate (recall)' },
  { icon: ShieldCheck, label: 'SPECIFICITY', value: '91.93%', desc: 'True negative rate' },
  { icon: Divide, label: 'F1-SCORE', value: '94.52%', desc: 'Harmonic mean of precision & recall' },
];

const barData = [
  { mag: '40×', accuracy: 90.1 },
  { mag: '100×', accuracy: 96.4 },
  { mag: '200×', accuracy: 98.0 },
  { mag: '400×', accuracy: 93.2 },
];

const radarData = [
  { metric: 'Accuracy', value: 94.21 },
  { metric: 'AUC', value: 98.71 },
  { metric: 'Sensitivity', value: 96.34 },
  { metric: 'Specificity', value: 91.93 },
  { metric: 'F1-score', value: 94.52 },
];

const CustomBar = (props: React.SVGProps<SVGRectElement> & { x?: number; y?: number; width?: number; height?: number }) => {
  const { x = 0, y = 0, width = 0, height = 0 } = props;
  return (
    <g>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF7A33" />
          <stop offset="100%" stopColor="#E85D00" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill="url(#barGrad)" rx={6} />
    </g>
  );
};

export default function ModelMetrics() {
  return (
    <>
      <div className="page-scroll">
        <div className="page-inner">
          <div className="fade-up">
            <div className="page-badge">PERFORMANCE</div>
            <h1 className="page-title">Model metrics</h1>
            <p className="page-subtitle">
              Hybrid CNN-ViT (Cross-Attention) — evaluation on the held-out BreakHis test split.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="stat-grid stat-grid-5">
            {stats.map(({ icon: Icon, label, value, desc }, i) => (
              <div key={label} className={`stat-card fade-up fade-up-${i + 1}`}>
                <div className="stat-label">
                  {label}
                  <Icon size={14} color="var(--text-muted)" />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-desc">{desc}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="chart-grid fade-up fade-up-3">
            {/* Bar Chart */}
            <div className="card card-pad">
              <div className="chart-card-title">Cross-magnification accuracy</div>
              <div className="chart-card-sub">Accuracy across BreakHis magnification levels.</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }} barSize={52}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="mag"
                    tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[85, 100]}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'Inter',
                    }}
                    formatter={(v: number) => [`${v}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracy" shape={<CustomBar />} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="card card-pad">
              <div className="chart-card-title">Metric profile</div>
              <div className="chart-card-sub">Balanced performance across all metrics.</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[80, 100]}
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#FF6B00"
                    fill="#FF6B00"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
