import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ProjectHeader } from '../components/project/ProjectHeader';

export function DatasetListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProjectById, datasets } = useAppStore();
  const project = getProjectById(projectId ?? '');
  const [showUpload, setShowUpload] = useState(false);

  if (!project) return null;
  const projectDatasets = datasets.filter((d) => project.datasetIds.includes(d.id));

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{projectDatasets.length} dataset{projectDatasets.length !== 1 ? 's' : ''}</p>
        <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
          <Plus size={13} /> Upload Dataset
        </Button>
      </div>

      <Card padding={false}>
        {projectDatasets.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">No datasets yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projectDatasets.map((ds) => {
              const trainCount = ds.entries.filter((e) => e.split === 'train').length;
              const valCount   = ds.entries.filter((e) => e.split === 'val').length;

              return (
                <button
                  key={ds.id}
                  onClick={() => navigate(`/projects/${projectId}/datasets/${ds.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {ds.name}
                        </span>
                        <Badge variant={ds.role === 'training' ? 'researcher' : 'info'}>{ds.role}</Badge>
                        <Badge variant="default">{ds.modalities.join(', ')}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{ds.description}</p>
                    </div>
                    <div className="shrink-0 ml-4 text-right">
                      <p className="text-base font-bold font-mono text-slate-700">{ds.entries.length}</p>
                      {ds.role === 'training' ? (
                        <p className="text-[10px] text-slate-400">{trainCount} train / {valCount} val</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">entries</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {showUpload && (
        <Modal
          title="Upload Dataset"
          onClose={() => setShowUpload(false)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button variant="primary" size="sm" disabled>Upload (demo stub)</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dataset Name</label>
              <input
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. Brain MRI Validation Set v2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={2}
                placeholder="Short description of the dataset…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="training">Training</option>
                  <option value="evaluation">Evaluation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modality</label>
                <select className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {['MRI', 'CT', 'X-Ray', 'ECG', 'Pathology', 'Clinical Note'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data File</label>
              <div className="border-2 border-dashed border-slate-200 rounded p-4 text-center text-sm text-slate-400">
                Drag & drop .csv / .json / .zip file here
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