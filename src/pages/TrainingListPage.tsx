import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle2, XCircle, Loader2, Clock, Link2 } from 'lucide-react';
import { useAppStore, generateTrainingHistory } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TrainingHistoryChart } from '../components/training/TrainingHistoryChart';

import { Modal } from '../components/ui/Modal';
import { Plus } from 'lucide-react';
import { ProjectHeader } from '../components/project/ProjectHeader';


export function TrainingListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProjectById, trainingRuns, getModelSpecById, getDatasetById, getUserById, datasets, currentUser, addTrainingRun, setTrainingRunStatus } = useAppStore();
  const [showNewRun, setShowNewRun] = useState(false);
  const [newRunModelId, setNewRunModelId]   = useState('');
  const [newRunWeightId, setNewRunWeightId] = useState('');
  const [newRunDatasetId, setNewRunDatasetId] = useState('');

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

  const handleStartRun = () => {
    if (!newRunModelId || !newRunDatasetId || !currentUser) return;
    const id = addTrainingRun({
      projectId: project.id,
      modelSpecId: newRunModelId,
      baseWeightsSnapshotId: newRunWeightId || undefined,
      trainDatasetId: newRunDatasetId,
      runBy: currentUser.id,
      status: 'running',
      parameterOverrides: {},
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
              <Button variant="outline" size="sm" onClick={() => setShowNewRun(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleStartRun} disabled={!newRunModelId || !newRunDatasetId}>
                Start Training
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Specification</label>
              <select
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newRunModelId}
                onChange={(e) => { setNewRunModelId(e.target.value); setNewRunWeightId(''); }}
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
                <p className="text-xs font-semibold text-slate-700 mb-1.5">Parameters (from model spec)</p>
                <div className="bg-slate-50 rounded p-2.5 grid grid-cols-2 gap-1">
                  {Object.entries(selectedModel.parameters).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="text-slate-400 font-mono">{k}</span>
                      <span className="text-slate-700 font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}