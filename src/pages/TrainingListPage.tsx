import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { useAppStore, generateTrainingHistory } from '../store/useAppStore';
import { USE_API } from '../services/config';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

import { Modal } from '../components/ui/Modal';
import { Plus } from 'lucide-react';
import { ProjectHeader } from '../components/project/ProjectHeader';


export function TrainingListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    getProjectById, trainingRuns, getModelSpecById, getDatasetById, getUserById, datasets,
    currentUser, addTrainingRun, setTrainingRunStatus, startTrainingRunApi,
  } = useAppStore();
  const [showNewRun, setShowNewRun] = useState(false);
  const [newRunModelId, setNewRunModelId]   = useState('');
  const [newRunWeightId, setNewRunWeightId] = useState('');
  const [newRunDatasetId, setNewRunDatasetId] = useState('');
  const [newRunParamsJson, setNewRunParamsJson] = useState('');
  const [newRunParamsError, setNewRunParamsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const project = getProjectById(projectId ?? '');
  if (!project) return null;

  const projRuns = trainingRuns.filter((r) => r.projectId === project.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const projectModels  = project.modelSpecIds.map((id) => getModelSpecById(id)).filter(Boolean);
  const trainingDs     = datasets.filter((d) => project.datasetIds.includes(d.id) && d.role === 'training');
  const selectedModel  = projectModels.find((m) => m?.id === newRunModelId);

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-emerald-600' : s === 'running' ? 'text-blue-500' : s === 'failed' ? 'text-red-500' : 'text-slate-400';

  /** Returns null (with setNewRunParamsError already called) on invalid JSON/value types. */
  const parseOverrides = (): Record<string, string | number | boolean> | null => {
    const overrides: Record<string, string | number | boolean> = {};
    if (!newRunParamsJson.trim()) return overrides;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(newRunParamsJson);
    } catch {
      setNewRunParamsError('Invalid JSON — please check the syntax.');
      return null;
    }
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') {
        setNewRunParamsError(`Value for "${k}" must be a string, number, or boolean.`);
        return null;
      }
    }
    const base = selectedModel?.parameters ?? {};
    for (const [k, v] of Object.entries(parsed)) {
      if (base[k] === undefined || String(base[k]) !== String(v)) {
        overrides[k] = v as string | number | boolean;
      }
    }
    return overrides;
  };

  const handleFillDemo = () => {
    const model = projectModels[0];
    const dataset = trainingDs[0];
    if (model) {
      setNewRunModelId(model.id);
      setNewRunParamsJson(JSON.stringify(model.parameters, null, 2));
    }
    setNewRunWeightId('');
    if (dataset) setNewRunDatasetId(dataset.id);
    setNewRunParamsError(null);
    setSubmitError(null);
  };

  const handleStartRun = async () => {
    if (!newRunModelId || !newRunDatasetId || !currentUser) return;
    const overrides = parseOverrides();
    if (overrides === null) return;

    if (USE_API) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const run = await startTrainingRunApi(project.id, {
          modelSpecId: newRunModelId,
          trainDatasetId: newRunDatasetId,
          baseWeightsSnapshotId: newRunWeightId || undefined,
          runBy: currentUser.id,
          parameterOverrides: overrides,
        });
        setShowNewRun(false);
        navigate(`/projects/${project.id}/training/${run.id}`);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const id = addTrainingRun({
      projectId: project.id,
      modelSpecId: newRunModelId,
      baseWeightsSnapshotId: newRunWeightId || undefined,
      trainDatasetId: newRunDatasetId,
      runBy: currentUser.id,
      status: 'running',
      parameterOverrides: overrides,
    });
    setShowNewRun(false);
    navigate(`/projects/${project.id}/training/${id}`);
    setTimeout(() => setTrainingRunStatus(id, 'running'), 100);
  };

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{projRuns.length} training run{projRuns.length !== 1 ? 's' : ''}</p>
        <Button variant="primary" size="sm" onClick={() => setShowNewRun(true)}>
          <Plus size={13} /> New Training Run
        </Button>
      </div>

      <Card padding={false}>
        {projRuns.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">No training runs yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projRuns.map((run) => {
              const model   = getModelSpecById(run.modelSpecId);
              const dataset = getDatasetById(run.trainDatasetId);
              const runner  = getUserById(run.runBy);
              const baseW   = run.baseWeightsSnapshotId ? model?.savedWeights.find((w) => w.id === run.baseWeightsSnapshotId) : undefined;

              return (
                <button
                  key={run.id}
                  onClick={() => navigate(`/projects/${project.id}/training/${run.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-600 group-hover:text-blue-600 transition-colors">{run.id}</span>
                        <span className={`text-[10px] font-semibold uppercase ${statusColor(run.status)}`}>{run.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span>{model?.name}</span>
                        {baseW ? <span>· from {baseW.name}</span> : <span>· from scratch</span>}
                        <span>· {dataset?.name}</span>
                        <span>· by {runner?.name}</span>
                        <span>· {new Date(run.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {run.status === 'completed' && run.finalMetrics && (
                      <div className="shrink-0 ml-4 text-right">
                        <p className={`text-base font-bold font-mono ${run.finalMetrics.finalValAccuracy >= 0.85 ? 'text-emerald-600' : run.finalMetrics.finalValAccuracy >= 0.75 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {(run.finalMetrics.finalValAccuracy * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-400">{run.finalMetrics.epochs} epochs</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {showNewRun && (
        <Modal
          title="New Training Run"
          onClose={() => setShowNewRun(false)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={handleFillDemo} disabled={projectModels.length === 0}>
                <Wand2 size={13} /> Fill Demo Data
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setShowNewRun(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartRun}
                disabled={!newRunModelId || !newRunDatasetId || isSubmitting}
              >
                {isSubmitting ? 'Starting…' : 'Start Training'}
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
                value={newRunModelId}
                onChange={(e) => {
                  const m = projectModels.find((m) => m?.id === e.target.value);
                  setNewRunModelId(e.target.value);
                  setNewRunWeightId('');
                  setNewRunParamsJson(m ? JSON.stringify(m.parameters, null, 2) : '');
                  setNewRunParamsError(null);
                }}
              >
                <option value="">Select a model…</option>
                {projectModels.map((m) => m && <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Weights (optional)</label>
              <select
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newRunWeightId}
                onChange={(e) => setNewRunWeightId(e.target.value)}
                disabled={!selectedModel}
              >
                <option value="">None — train from scratch</option>
                {selectedModel?.savedWeights.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Training Dataset</label>
              <select
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newRunDatasetId}
                onChange={(e) => setNewRunDatasetId(e.target.value)}
              >
                <option value="">Select a training dataset…</option>
                {trainingDs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.entries.filter((e) => e.split === 'train').length} train / {d.entries.filter((e) => e.split === 'val').length} val)
                  </option>
                ))}
              </select>
              {trainingDs.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">No training datasets found in this project.</p>
              )}
            </div>
            {selectedModel && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parameter Overrides
                  <span className="ml-1.5 font-normal text-slate-400">(edit values to override model defaults)</span>
                </label>
                <textarea
                  className="w-full h-48 font-mono text-xs border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={newRunParamsJson}
                  onChange={(e) => { setNewRunParamsJson(e.target.value); setNewRunParamsError(null); }}
                  spellCheck={false}
                />
                {newRunParamsError && (
                  <p className="text-xs text-red-600 font-medium mt-1">{newRunParamsError}</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}