import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function ModelDetailPage() {
  const { projectId, modelId } = useParams<{ projectId: string; modelId: string }>();
  const navigate = useNavigate();
  const { getProjectById, getModelSpecById, getUserById } = useAppStore();

  const project = getProjectById(projectId ?? '');
  const spec    = getModelSpecById(modelId ?? '');

  if (!project || !spec) {
    return <div className="text-sm text-slate-500 p-4">Model not found.</div>;
  }

  const uploader = getUserById(spec.uploadedBy);

  let parsed: Record<string, unknown> | null = null;
  try { parsed = JSON.parse(spec.architecture); } catch { /* ok */ }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/models`)}>
          <ArrowLeft size={13} /> Models
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-800">{spec.name}</h2>
            <Badge variant="info">{spec.type}</Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{spec.description}</p>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono">
        Uploaded by {uploader?.name ?? spec.uploadedBy} · {new Date(spec.uploadedAt).toLocaleDateString()}
      </div>

      {/* Architecture + Parameters */}
      <Card padding={false}>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Architecture */}
          <div className="p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Architecture</p>
            {parsed ? (
              <div className="space-y-1.5">
                {Object.entries(parsed).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-slate-400 font-mono w-32 shrink-0">{k}</span>
                    <span className="text-slate-700 font-mono break-all">
                      {Array.isArray(v) ? v.join(' → ') : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs text-slate-700 bg-slate-50 rounded p-2 overflow-auto max-h-48">{spec.architecture}</pre>
            )}
          </div>

          {/* Parameters */}
          <div className="p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Training Parameters</p>
            <div className="space-y-1.5">
              {Object.entries(spec.parameters).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="text-slate-400 font-mono w-32 shrink-0">{k}</span>
                  <span className="text-slate-700 font-mono">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Weight snapshots */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">
          Saved Weights ({spec.savedWeights.length})
        </p>
        {spec.savedWeights.length === 0 ? (
          <Card>
            <div className="text-center py-6 text-sm text-slate-400">No weight snapshots saved yet.</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {spec.savedWeights.map((w) => (
              <Card key={w.id} padding={false}>
                <div className="flex items-start gap-3 p-4">
                  <HardDrive size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-700">{w.name}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(w.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{w.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{w.filePath}</p>
                    {w.sourceTrainingRunId && (
                      <p className="text-[10px] text-blue-500 mt-0.5 font-mono">
                        from run {w.sourceTrainingRunId}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
