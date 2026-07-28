import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle2, XCircle, Loader2, Clock, Link2 } from 'lucide-react';
import { useAppStore, generateTrainingHistory } from '../store/useAppStore';
import { USE_API } from '../services/config';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TrainingHistoryChart } from '../components/training/TrainingHistoryChart';

const POLL_INTERVAL_MS = 3000;

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === 'running')   return <Loader2 size={14} className="text-blue-500 animate-spin" />;
  if (status === 'failed')    return <XCircle size={14} className="text-red-500" />;
  return <Clock size={14} className="text-slate-400" />;
}

const statusVariant = (s: string): 'success' | 'info' | 'danger' | 'muted' =>
  s === 'completed' ? 'success' : s === 'running' ? 'info' : s === 'failed' ? 'danger' : 'muted';

export function TrainingDetailPage() {
  const { projectId, runId } = useParams<{ projectId: string; runId: string }>();
  const navigate = useNavigate();
  const {
    currentUser, getTrainingRunById, getProjectById,
    getModelSpecById, getDatasetById, getUserById,
    setTrainingRunStatus, completeTrainingRun,
    startTrainingRunApi, refreshTrainingRun,
  } = useAppStore();

  const run     = getTrainingRunById(runId ?? '');
  const project = getProjectById(projectId ?? '');
  const model   = run ? getModelSpecById(run.modelSpecId) : undefined;
  const baseW   = run?.baseWeightsSnapshotId
    ? model?.savedWeights.find((w) => w.id === run.baseWeightsSnapshotId)
    : undefined;
  const outW    = run?.outputWeightsSnapshotId
    ? model?.savedWeights.find((w) => w.id === run.outputWeightsSnapshotId)
    : undefined;
  const dataset = run ? getDatasetById(run.trainDatasetId) : undefined;
  const runner  = run ? getUserById(run.runBy) : undefined;

  const [isSimulating, setIsSimulating] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  // Demo mode only: fake completion 3s after status flips to 'running'.
  useEffect(() => {
    if (USE_API) return;
    if (run?.status === 'running' && !isSimulating) {
      setIsSimulating(true);
      const timer = setTimeout(() => {
        if (run) {
          const epochs = (run.parameterOverrides.epochs as number | undefined) ?? 20;
          const finalAcc = run.finalMetrics?.finalValAccuracy ?? 0.78;
          const history = generateTrainingHistory(epochs, finalAcc);
          const metrics = {
            finalTrainLoss: history[history.length - 1].trainLoss,
            finalValLoss: history[history.length - 1].valLoss,
            finalValAccuracy: history[history.length - 1].valAccuracy,
            epochs,
          };
          completeTrainingRun(run.id, history, metrics, `Auto-generated — ${new Date().toLocaleDateString()}`);
        }
        setIsSimulating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [run?.status]);

  // Real backend: poll Firestore-backed status/trainingHistory while the
  // Cloud Run Job is pending/running.
  useEffect(() => {
    if (!USE_API || !runId) return;
    if (run?.status !== 'pending' && run?.status !== 'running') return;
    const interval = setInterval(() => refreshTrainingRun(runId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [USE_API, runId, run?.status]);

  if (!run || !project) {
    return <div className="text-sm text-slate-500 p-4">Training run not found.</div>;
  }

  const handleRerun = async () => {
    if (!USE_API) {
      setTrainingRunStatus(run.id, 'running');
      return;
    }
    if (!currentUser) return;
    setIsRerunning(true);
    setRerunError(null);
    try {
      const newRun = await startTrainingRunApi(project.id, {
        modelSpecId: run.modelSpecId,
        trainDatasetId: run.trainDatasetId,
        baseWeightsSnapshotId: run.baseWeightsSnapshotId,
        runBy: currentUser.id,
        parameterOverrides: run.parameterOverrides,
      });
      navigate(`/projects/${project.id}/training/${newRun.id}`);
    } catch (err) {
      setRerunError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRerunning(false);
    }
  };

  const trainCount = dataset?.entries.filter((e) => e.split === 'train').length ?? 0;
  const valCount   = dataset?.entries.filter((e) => e.split === 'val').length ?? 0;

  const hasOverrides = Object.keys(run.parameterOverrides).length > 0;
  const baseParams   = model?.parameters ?? {};

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(`/projects/${project.id}/training`)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={12} /> Training runs
      </button>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-slate-500">{run.id}</span>
              <div className="flex items-center gap-1">
                <StatusIcon status={run.status} />
                <Badge variant={statusVariant(run.status)} className="capitalize">{run.status}</Badge>
              </div>
            </div>
            <h1 className="text-base font-semibold text-slate-800 mb-2">{model?.name ?? '—'}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-slate-500">
              <div>
                <span className="text-slate-400">Base weights</span><br />
                <span className="text-slate-700 font-medium">{baseW?.name ?? 'None (train from scratch)'}</span>
              </div>
              <div>
                <span className="text-slate-400">Training dataset</span><br />
                <span className="text-slate-700 font-medium">{dataset?.name ?? '—'}</span>
                {trainCount > 0 && <span className="text-slate-400 ml-1">({trainCount} train / {valCount} val)</span>}
              </div>
              <div>
                <span className="text-slate-400">Run by</span><br />
                <span className="text-slate-700 font-medium">{runner?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">Started</span><br />
                <span className="text-slate-700">{new Date(run.createdAt).toLocaleString()}</span>
              </div>
              {run.completedAt && (
                <div>
                  <span className="text-slate-400">Completed</span><br />
                  <span className="text-slate-700">{new Date(run.completedAt).toLocaleString()}</span>
                </div>
              )}
              {outW && (
                <div>
                  <span className="text-slate-400">Output weights</span><br />
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Link2 size={10} />{outW.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {currentUser?.role === 'researcher' && run.status !== 'running' && run.status !== 'pending' && (
            <Button variant="primary" size="md" onClick={handleRerun} disabled={isSimulating || isRerunning}>
              {isSimulating || isRerunning
                ? <><Loader2 size={13} className="animate-spin" /> {USE_API ? 'Starting…' : 'Running…'}</>
                : <><PlayCircle size={13} /> Re-run</>}
            </Button>
          )}
        </div>
      </div>

      {rerunError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{rerunError}</p>
      )}

      {/* Running state */}
      {(run.status === 'running' || run.status === 'pending') && (
        <Card>
          <div className="flex items-center gap-2 text-sm text-blue-600 py-6 justify-center">
            <Loader2 size={16} className="animate-spin" />
            {run.status === 'pending'
              ? (USE_API ? 'Starting Cloud Run Job…' : 'Preparing…')
              : (USE_API ? 'Training in progress on Cloud Run…' : 'Training in progress… this will take a few seconds')}
          </div>
        </Card>
      )}

      {/* Parameters */}
      <Card>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Training Parameters
          {hasOverrides && <span className="ml-2 text-amber-600 normal-case font-normal">(overrides applied)</span>}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
          {Object.entries(baseParams).map(([k, v]) => {
            const override = run.parameterOverrides[k];
            const display  = override !== undefined ? override : v;
            return (
              <div key={k}>
                <p className="text-[10px] text-slate-400 font-mono">{k}</p>
                <p className={`text-xs font-mono font-semibold ${override !== undefined ? 'text-amber-700' : 'text-slate-700'}`}>
                  {String(display)}
                  {override !== undefined && (
                    <span className="ml-1 text-slate-400 font-normal line-through">{String(v)}</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Training history */}
      {run.status === 'completed' && run.trainingHistory.length > 0 && (
        <>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Training History</p>
            <TrainingHistoryChart history={run.trainingHistory} />
          </div>

          {/* Final metrics */}
          {run.finalMetrics && (
            <Card>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Final Metrics</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Val Accuracy', value: `${(run.finalMetrics.finalValAccuracy * 100).toFixed(1)}%`, color: 'text-emerald-600' },
                  { label: 'Val Loss',     value: run.finalMetrics.finalValLoss.toFixed(3), color: 'text-slate-800' },
                  { label: 'Train Loss',   value: run.finalMetrics.finalTrainLoss.toFixed(3), color: 'text-slate-800' },
                  { label: 'Epochs',       value: String(run.finalMetrics.epochs), color: 'text-slate-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-2xl font-bold font-mono mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
