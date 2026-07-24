import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ProjectHeader } from '../components/project/ProjectHeader';

export function ModelListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProjectById, modelSpecs, getUserById, currentUser } = useAppStore();
  const project = getProjectById(projectId ?? '');
  const [showUpload, setShowUpload] = useState(false);

  if (!project) return null;
  const specs = modelSpecs.filter((m) => project.modelSpecIds.includes(m.id));

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{specs.length} model specification{specs.length !== 1 ? 's' : ''}</p>
        {currentUser?.role === 'researcher' && (
          <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
            <Plus size={13} /> Upload Model
          </Button>
        )}
      </div>

      <Card padding={false}>
        {specs.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">No model specifications yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {specs.map((spec) => {
              const uploader = getUserById(spec.uploadedBy);
              return (
                <button
                  key={spec.id}
                  onClick={() => navigate(`/projects/${project.id}/models/${spec.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {spec.name}
                        </span>
                        <Badge variant="info">{spec.type}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-0.5">{spec.description}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                        <span>Uploaded by {uploader?.name ?? spec.uploadedBy}</span>
                        <span>· {new Date(spec.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0 ml-4 text-right">
                      <p className="text-base font-bold font-mono text-slate-700">{spec.savedWeights.length}</p>
                      <p className="text-[10px] text-slate-400">weight{spec.savedWeights.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upload stub modal */}
      {showUpload && (
        <Modal title="Upload Model" onClose={() => setShowUpload(false)} footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button variant="primary" size="sm" disabled>Upload (demo stub)</Button>
          </>
        }>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name</label>
              <input className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="e.g. ResNet-50 v2.0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {['classification', 'regression', 'detection', 'segmentation'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Architecture (JSON or text)</label>
              <textarea className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" rows={4} placeholder='{"backbone": "ResNet-50", "output_classes": 4}' />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model & Weights file</label>
              <div className="border-2 border-dashed border-slate-200 rounded p-4 text-center text-sm text-slate-400">
                Drag & drop .pth / .h5 / .keras / .onnx file here
              </div>
            </div>
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded p-2">
              File upload is a demo stub and will not persist.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}