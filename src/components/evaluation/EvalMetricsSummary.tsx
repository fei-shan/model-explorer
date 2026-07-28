import type { AnyEntryResult, EntryResult, EvaluationMetrics, ModelType } from '../../types';
import { isEntryResultCorrect } from '../../utils/entryResults';

interface Props {
  metrics: EvaluationMetrics;
  modelType: ModelType | undefined;
  entryResults: AnyEntryResult[];
}

export function EvalMetricsSummary({ metrics, modelType, entryResults }: Props) {
  if (modelType === 'clustering') {
    const sil = metrics.silhouetteScore ?? 0;
    const color =
      sil >= 0.5 ? 'text-emerald-600' :
      sil >= 0.25 ? 'text-blue-600' :
      'text-amber-600';
    return (
      <div className="shrink-0 ml-4 text-right">
        <p className={`text-base font-bold font-mono ${color}`}>
          {metrics.silhouetteScore?.toFixed(3) ?? '—'}
        </p>
        <p className="text-[10px] text-slate-400">{metrics.numClusters ?? '?'} clusters · silhouette</p>
      </div>
    );
  }

  if (modelType === 'llm-finetuning') {
    const ppl = metrics.perplexity ?? 999;
    const color =
      ppl <= 10 ? 'text-emerald-600' :
      ppl <= 25 ? 'text-blue-600' :
      'text-amber-600';
    return (
      <div className="shrink-0 ml-4 text-right">
        <p className={`text-base font-bold font-mono ${color}`}>
          {metrics.perplexity?.toFixed(1) ?? '—'}
        </p>
        <p className="text-[10px] text-slate-400">perplexity · ROUGE-L {metrics.rougeL?.toFixed(3) ?? '—'}</p>
      </div>
    );
  }

  if (modelType === 'regression') {
    const r2 = metrics.r2 ?? 0;
    const color =
      r2 >= 0.85 ? 'text-emerald-600' :
      r2 >= 0.6 ? 'text-blue-600' :
      'text-amber-600';
    return (
      <div className="shrink-0 ml-4 text-right">
        <p className={`text-base font-bold font-mono ${color}`}>
          {metrics.r2 !== undefined ? metrics.r2.toFixed(3) : '—'}
        </p>
        <p className="text-[10px] text-slate-400">R² · RMSE {metrics.rmse?.toFixed(3) ?? '—'}</p>
      </div>
    );
  }

  // classification (default)
  const acc = metrics.accuracy ?? 0;
  const color =
    acc >= 0.85 ? 'text-emerald-600' :
    acc >= 0.75 ? 'text-blue-600' :
    'text-amber-600';
  const failures = entryResults
    .filter((r): r is EntryResult => 'predictedLabel' in r)
    .filter((r) => !isEntryResultCorrect(r, modelType)).length;

  return (
    <div className="shrink-0 ml-4 text-right">
      <p className={`text-base font-bold font-mono ${color}`}>
        {metrics.accuracy !== undefined ? `${(metrics.accuracy * 100).toFixed(1)}%` : '—'}
      </p>
      <p className="text-[10px] text-slate-400">{failures} failure{failures !== 1 ? 's' : ''}</p>
    </div>
  );
}
