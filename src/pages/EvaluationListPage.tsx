import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Wand2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { USE_API } from '../services/config';
import { Button } from '../components/ui/Button';
import { EvalMetricsSummary } from '../components/evaluation/EvalMetricsSummary';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ProjectHeader } from '../components/project/ProjectHeader';


export function EvaluationListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProjectById, evaluations, datasets, getModelSpecById, getDatasetById, getUserById, currentUser, startEvaluationApi } = useAppStore();
  const [showNewEval, setShowNewEval] = useState(false);
  const [newEvalModelId, setNewEvalModelId] = useState('');
  const [newEvalWeightId, setNewEvalWeightId] = useState('');
  const [newEvalDatasetId, setNewEvalDatasetId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const project = getProjectById(projectId ?? '');
  if (!project) return null;
  const projEvals = evaluations.filter((e) => e.projectId === project.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-emerald-600' : s === 'running' ? 'text-blue-500' : s === 'failed' ? 'text-red-500' : 'text-slate-400';

  const projectModels  = project.modelSpecIds.map((id) => getModelSpecById(id)).filter(Boolean);
  const selectedModel  = projectModels.find((m) => m?.id === newEvalModelId);
  const evalDatasets   = datasets.filter((d) => project.datasetIds.includes(d.id) && d.role === 'evaluation');

  const handleFillDemo = () => {
    const model = projectModels.find((m) => m && m.savedWeights.length > 0) ?? projectModels[0];
    const dataset = evalDatasets[0];
    if (model) {
      setNewEvalModelId(model.id);
      setNewEvalWeightId(model.savedWeights[model.savedWeights.length - 1]?.id ?? '');
    }
    if (dataset) setNewEvalDatasetId(dataset.id);
    setSubmitError(null);
  };

  const handleStartEval = async () => {
    if (!newEvalModelId || !newEvalWeightId || !newEvalDatasetId || !currentUser) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const evaluation = await startEvaluationApi(project.id, {
        modelSpecId: newEvalModelId,
        weightsSnapshotId: newEvalWeightId,
        datasetId: newEvalDatasetId,
        runBy: currentUser.id,
      });
      setShowNewEval(false);
      navigate(`/projects/${project.id}/evaluations/${evaluation.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{projEvals.length} evaluation{projEvals.length !== 1 ? 's' : ''}</p>
        <Button variant="primary" size="sm" onClick={() => setShowNewEval(true)}>
          <Plus size={13} /> New Evaluation Run
        </Button>
      </div>
      <Card padding={false}>
        {projEvals.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">No evaluations yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projEvals.map((ev) => {
              const model    = getModelSpecById(ev.modelSpecId);
              const weights  = model?.savedWeights.find((w) => w.id === ev.weightsSnapshotId);
              const dataset  = getDatasetById(ev.datasetId);
              const runner   = getUserById(ev.runBy);
              const mt = model?.type;

              return (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/projects/${project.id}/evaluations/${ev.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-600 group-hover:text-blue-600 transition-colors">{ev.id}</span>
                        <span className={`text-[10px] font-semibold uppercase ${statusColor(ev.status)}`}>{ev.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span>{model?.name}</span>
                        {weights && <span>· {weights.name}</span>}
                        <span>· {dataset?.name}</span>
                        <span>· by {runner?.name}</span>
                        <span>· {new Date(ev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {ev.status === 'completed' && (
                      <EvalMetricsSummary
                        metrics={ev.metrics}
                        modelType={mt}
                        entryResults={ev.entryResults}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
      {showNewEval && (
        <Modal
          title="New Evaluation Run"
          onClose={() => setShowNewEval(false)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={handleFillDemo} disabled={projectModels.length === 0}>
                <Wand2 size={13} /> Fill Demo Data
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setShowNewEval(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartEval}
                disabled={!USE_API || !newEvalModelId || !newEvalWeightId || !newEvalDatasetId || isSubmitting}
              >
                {isSubmitting ? 'Starting…' : 'Run Evaluation'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {submitError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{submitError}</p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Specification</label>
              <select
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newEvalModelId}
                onChange={(e) => { setNewEvalModelId(e.target.value); setNewEvalWeightId(''); }}
              >
                <option value="">Select a model…</option>
                {projectModels.map((m) => m && <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weights Snapshot</label>
              <select
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newEvalWeightId}
                onChange={(e) => setNewEvalWeightId(e.target.value)}
                disabled={!selectedModel}
              >
                <option value="">Select weights…</option>
                {selectedModel?.savedWeights.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluation Dataset</label>
              <select
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newEvalDatasetId}
                onChange={(e) => setNewEvalDatasetId(e.target.value)}
              >
                <option value="">Select an evaluation dataset…</option>
                {evalDatasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.entries.length} entries)</option>
                ))}
              </select>
            </div>
            {!USE_API && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded p-2">
                Evaluation execution requires the real backend (VITE_USE_API=true) — this demo/mock mode doesn't
                simulate evaluation runs.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}