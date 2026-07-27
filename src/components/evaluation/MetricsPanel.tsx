import type { EvaluationMetrics, ModelType } from '../../types';
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
function dec(v?: number, digits = 3) {
  return v !== undefined ? v.toFixed(digits) : '—';
}

interface Props {
  metrics: EvaluationMetrics;
  modelType: ModelType;
}

export function MetricsPanel({ metrics, modelType }: Props) {
  if (modelType === 'clustering') return <ClusteringMetricsPanel metrics={metrics} />;
  if (modelType === 'llm-finetuning') return <LLMMetricsPanel metrics={metrics} />;
  return <ClassificationMetricsPanel metrics={metrics} />;
}

// ── Classification / Regression ──────────────────────────────────────────────
function ClassificationMetricsPanel({ metrics }: { metrics: EvaluationMetrics }) {
  const acc = metrics.accuracy ?? 0;
  const accuracyColor =
    acc >= 0.9 ? 'text-emerald-600' :
    acc >= 0.75 ? 'text-blue-600' :
    'text-amber-600';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.accuracy !== undefined && (
          <MetricCard label="Accuracy" value={pct(metrics.accuracy)} color={accuracyColor} />
        )}
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

// ── Clustering ────────────────────────────────────────────────────────────────
function ClusteringMetricsPanel({ metrics }: { metrics: EvaluationMetrics }) {
  const sil = metrics.silhouetteScore ?? 0;
  const silhouetteColor =
    sil >= 0.5 ? 'text-emerald-600' :
    sil >= 0.25 ? 'text-blue-600' :
    'text-amber-600';

  const maxSize = metrics.clusterSizes?.length ? Math.max(...metrics.clusterSizes) : 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.silhouetteScore !== undefined && (
          <MetricCard
            label="Silhouette Score"
            value={dec(metrics.silhouetteScore)}
            sub="–1 to 1, higher is better"
            color={silhouetteColor}
          />
        )}
        {metrics.numClusters !== undefined && (
          <MetricCard label="Clusters (k)" value={String(metrics.numClusters)} sub="Number of clusters" />
        )}
        {metrics.daviesBouldinIndex !== undefined && (
          <MetricCard label="Davies-Bouldin" value={dec(metrics.daviesBouldinIndex)} sub="Lower is better" />
        )}
        {metrics.calinskiHarabaszIndex !== undefined && (
          <MetricCard
            label="Calinski-Harabasz"
            value={metrics.calinskiHarabaszIndex.toFixed(1)}
            sub="Higher is better"
          />
        )}
      </div>

      {metrics.clusterSizes && metrics.clusterSizes.length > 0 && (
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Cluster Size Distribution
            </p>
            <div className="space-y-2">
              {metrics.clusterSizes.map((size, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500 w-16 shrink-0">Cluster {i}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${(size / maxSize) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 w-8 text-right shrink-0">{size}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── LLM Fine-tuning ───────────────────────────────────────────────────────────
function LLMMetricsPanel({ metrics }: { metrics: EvaluationMetrics }) {
  const ppl = metrics.perplexity ?? 999;
  const perplexityColor =
    ppl <= 10 ? 'text-emerald-600' :
    ppl <= 25 ? 'text-blue-600' :
    'text-amber-600';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.perplexity !== undefined && (
          <MetricCard label="Perplexity" value={metrics.perplexity.toFixed(2)} sub="Lower is better" color={perplexityColor} />
        )}
        {metrics.rougeL !== undefined && (
          <MetricCard label="ROUGE-L" value={dec(metrics.rougeL)} sub="Longest common subseq." />
        )}
        {metrics.bleu !== undefined && (
          <MetricCard label="BLEU" value={dec(metrics.bleu)} sub="n-gram overlap" />
        )}
        {metrics.bertScore !== undefined && (
          <MetricCard label="BERTScore F1" value={dec(metrics.bertScore)} sub="Semantic similarity" />
        )}
      </div>

      {metrics.benchmarks && Object.keys(metrics.benchmarks).length > 0 && (
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Benchmark Results
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(metrics.benchmarks).map(([name, score]) => (
                <div key={name} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                  <span className="text-[11px] font-medium text-slate-600">{name}</span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      score >= 0.8 ? 'text-emerald-600' : score >= 0.65 ? 'text-blue-600' : 'text-amber-600'
                    }`}
                  >
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
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
