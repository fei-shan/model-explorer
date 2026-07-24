import type { EvaluationMetrics } from '../../types';
import { Card } from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function MetricCard({ label, value, sub, color = 'text-slate-800' }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

function pct(v?: number) {
  return v !== undefined ? `${(v * 100).toFixed(1)}%` : '—';
}
function dec(v?: number) {
  return v !== undefined ? v.toFixed(3) : '—';
}

interface Props {
  metrics: EvaluationMetrics;
}

export function MetricsPanel({ metrics }: Props) {
  const accuracyColor =
    metrics.accuracy >= 0.9 ? 'text-emerald-600' :
    metrics.accuracy >= 0.75 ? 'text-blue-600' :
    'text-amber-600';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Accuracy" value={pct(metrics.accuracy)} color={accuracyColor} />
        {metrics.auc !== undefined && (
          <MetricCard label="AUC-ROC" value={dec(metrics.auc)} sub="Area under curve" />
        )}
        {metrics.f1 !== undefined && (
          <MetricCard label="F1 Score" value={dec(metrics.f1)} sub="Macro-averaged" />
        )}
        {metrics.sensitivity !== undefined && (
          <MetricCard label="Sensitivity" value={pct(metrics.sensitivity)} sub="Recall / TPR" />
        )}
        {metrics.specificity !== undefined && (
          <MetricCard label="Specificity" value={pct(metrics.specificity)} sub="True negative rate" />
        )}
        {metrics.rmse !== undefined && (
          <MetricCard label="RMSE" value={metrics.rmse.toFixed(4)} />
        )}
        {metrics.r2 !== undefined && (
          <MetricCard label="R²" value={metrics.r2.toFixed(3)} />
        )}
      </div>

      {metrics.confusionMatrix && (
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Confusion Matrix
            </p>
            <ConfusionMatrixTable
              labels={metrics.confusionMatrix.labels}
              matrix={metrics.confusionMatrix.matrix}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function ConfusionMatrixTable({ labels, matrix }: { labels: string[]; matrix: number[][] }) {
  const maxVal = Math.max(...matrix.flatMap((r) => r));

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-24" />
            <th colSpan={labels.length} className="text-center text-slate-500 font-semibold pb-1 px-2">
              ← Predicted →
            </th>
          </tr>
          <tr>
            <th className="text-right pr-3 text-slate-500 font-semibold pb-1 text-[10px]">Actual ↓</th>
            {labels.map((l) => (
              <th key={l} className="text-center px-2 pb-1 font-medium text-slate-600 whitespace-nowrap">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="text-right pr-3 py-1 font-medium text-slate-600 whitespace-nowrap">{labels[i]}</td>
              {row.map((val, j) => {
                const isDiag = i === j;
                const intensity = maxVal > 0 ? val / maxVal : 0;
                const bg = isDiag
                  ? `rgba(5,150,105,${0.12 + intensity * 0.45})`
                  : val > 0
                  ? `rgba(220,38,38,${0.08 + intensity * 0.35})`
                  : 'transparent';
                return (
                  <td
                    key={j}
                    className="text-center px-3 py-2 font-mono font-semibold border border-slate-100"
                    style={{ background: bg, color: isDiag ? '#065f46' : val > 0 ? '#991b1b' : '#94a3b8', minWidth: '48px' }}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
