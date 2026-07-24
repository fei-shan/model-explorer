import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MetricsPanel } from '../components/evaluation/MetricsPanel';
import { EntryResultTable } from '../components/evaluation/EntryResultTable';

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === 'running')   return <Loader2 size={14} className="text-blue-500 animate-spin" />;
  if (status === 'failed')    return <XCircle size={14} className="text-red-500" />;
  return <Clock size={14} className="text-slate-400" />;
}

const statusVariant = (s: string): 'success' | 'info' | 'danger' | 'muted' =>
  s === 'completed' ? 'success' : s === 'running' ? 'info' : s === 'failed' ? 'danger' : 'muted';

export function EvaluationDetailPage() {
  const { projectId, evaluationId } = useParams<{ projectId: string; evaluationId: string }>();
  const navigate = useNavigate();
  const {
    currentUser, getEvaluationById, getProjectById,
    getModelSpecById, getDatasetById, getUserById, setEvaluationStatus,
  } = useAppStore();

  const evaluation = getEvaluationById(evaluationId ?? '');
  const project    = getProjectById(projectId ?? '');
  const model      = evaluation ? getModelSpecById(evaluation.modelSpecId) : undefined;
  const weights    = model?.savedWeights.find((w) => w.id === evaluation?.weightsSnapshotId);
  const dataset    = evaluation ? getDatasetById(evaluation.datasetId) : undefined;
  const runner     = evaluation ? getUserById(evaluation.runBy) : undefined;

  const isResearcher = currentUser?.role === 'researcher';
  const [showFull, setShowFull] = useState(isResearcher);
  const [isRerunning, setIsRerunning] = useState(false);

  useEffect(() => { setShowFull(isResearcher); }, [isResearcher]);

  if (!evaluation || !project) {
    return <div className="text-sm text-slate-500 p-4">Evaluation not found.</div>;
  }

  const handleRerun = () => {
    setIsRerunning(true);
    setEvaluationStatus(evaluation.id, 'running');
    setTimeout(() => {
      setEvaluationStatus(evaluation.id, 'completed');
      setIsRerunning(false);
    }, 2500);
  };

  const failures = evaluation.entryResults.filter((r) => r.predictedLabel !== r.trueLabel).length;
  const total    = evaluation.entryResults.length;

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(`/projects/${project.id}/evaluations`)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={12} /> Evaluations
      </button>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-slate-500">{evaluation.id}</span>
              <div className="flex items-center gap-1">
                <StatusIcon status={evaluation.status} />
                <Badge variant={statusVariant(evaluation.status)} className="capitalize">{evaluation.status}</Badge>
              </div>
            </div>
            <h1 className="text-base font-semibold text-slate-800 mb-2">{project.name}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-500">
              <div><span className="text-slate-400">Model</span><br /><span className="text-slate-700 font-medium">{model?.name ?? '—'}</span></div>
              <div><span className="text-slate-400">Weights</span><br /><span className="text-slate-700 font-medium">{weights?.name ?? '—'}</span></div>
              <div><span className="text-slate-400">Dataset</span><br /><span className="text-slate-700 font-medium">{dataset?.name ?? '—'}</span></div>
              <div><span className="text-slate-400">Run by</span><br /><span className="text-slate-700 font-medium">{runner?.name ?? '—'}</span></div>
              <div><span className="text-slate-400">Started</span><br /><span className="text-slate-700">{new Date(evaluation.createdAt).toLocaleString()}</span></div>
              {evaluation.completedAt && (
                <div><span className="text-slate-400">Completed</span><br /><span className="text-slate-700">{new Date(evaluation.completedAt).toLocaleString()}</span></div>
              )}
              <div>
                <span className="text-slate-400">Entries</span><br />
                <span className="text-slate-700">
                  {total} total ·{' '}
                  <span className={clsx(failures > 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {failures} failure{failures !== 1 ? 's' : ''}
                  </span>
                </span>
              </div>
            </div>
          </div>
          {isResearcher && (
            <Button variant="primary" size="md" onClick={handleRerun} disabled={isRerunning || evaluation.status === 'running'}>
              {isRerunning
                ? <><Loader2 size={13} className="animate-spin" /> Running…</>
                : <><PlayCircle size={13} /> Re-run</>}
            </Button>
          )}
        </div>
      </div>

      {/* Metrics */}
      {evaluation.status === 'completed' && (
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evaluation Metrics</p>
          <MetricsPanel metrics={evaluation.metrics} />
        </Card>
      )}

      {evaluation.status === 'running' && (
        <Card>
          <div className="flex items-center gap-2 text-sm text-blue-600 py-4 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Running evaluation…
          </div>
        </Card>
      )}

      {/* Entry results */}
      {evaluation.status === 'completed' && (
        <Card>
          <EntryResultTable
            results={evaluation.entryResults}
            evaluationId={evaluation.id}
            showFull={showFull}
            onToggleFull={() => setShowFull((v) => !v)}
            isResearcher={isResearcher}
          />
        </Card>
      )}
    </div>
  );
}
