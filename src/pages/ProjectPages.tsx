import { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeft, Database, Brain, FlaskConical, Flag, Users, Calendar, Edit2, Check, X, GraduationCap, Plus, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { Badge, LabelBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { MedicalImagePlaceholder } from '../components/medical/MedicalImagePlaceholder';
import { FlagCard } from '../components/review/FlagCard';
import type { Entry } from '../types';

// ── Tab helpers ──────────────────────────────────────────────────────────────

function TabLink({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
          isActive
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
        )
      }
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

// ── Shared project header ─────────────────────────────────────────────────────

export function ProjectHeader() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectById, getFlagsForProject, currentUser } = useAppStore();
  const navigate = useNavigate();

  const project = getProjectById(projectId ?? '');
  if (!project) return null;

  const openFlags = getFlagsForProject(project.id).filter((f) => f.status !== 'dismissed').length;

  return (
    <div className="mb-5">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-3 transition-colors"
      >
        <ArrowLeft size={12} /> All projects
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="info">{project.domain}</Badge>
            {project.members.find((m) => m.userId === currentUser?.id)?.role === 'researcher'
              ? <Badge variant="researcher">Researcher</Badge>
              : <Badge variant="practitioner">Practitioner</Badge>}
          </div>
          <h1 className="text-lg font-semibold text-slate-800">{project.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 ml-4">
          <span className="flex items-center gap-1"><Users size={11} />{project.members.length} members</span>
          <span className="flex items-center gap-1"><Calendar size={11} />{new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-200 -mb-px">
        <TabLink to={`/projects/${project.id}/datasets`}    icon={<Database size={13} />}      label="Datasets" />
        <TabLink to={`/projects/${project.id}/models`}      icon={<Brain size={13} />}          label="Models" />
        {currentUser?.role === 'researcher' && (
          <TabLink to={`/projects/${project.id}/training`}  icon={<GraduationCap size={13} />}  label="Training" />
        )}
        <TabLink to={`/projects/${project.id}/evaluations`} icon={<FlaskConical size={13} />}   label="Evaluations" />
        <TabLink to={`/projects/${project.id}/review`}      icon={<Flag size={13} />}           label="Review" badge={openFlags} />
        <TabLink to={`/projects/${project.id}/members`}     icon={<Users size={13} />}          label="Members" />
      </div>
    </div>
  );
}

// ── Datasets page ─────────────────────────────────────────────────────────────

export function DatasetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectById, datasets, currentUser } = useAppStore();
  const project = getProjectById(projectId ?? '');

  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  if (!project) return null;
  const projectDatasets = datasets.filter((d) => project.datasetIds.includes(d.id));

  return (
    <div className="space-y-4">
      <ProjectHeader />
      {projectDatasets.map((ds) => (
        <DatasetSection key={ds.id} datasetId={ds.id} onSelectEntry={setSelectedEntry} />
      ))}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          datasetId={selectedEntry.datasetId}
          labelSet={projectDatasets.find((d) => d.id === selectedEntry.datasetId)?.labelSet ?? []}
          isResearcher={currentUser?.role === 'researcher'}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

function DatasetSection({ datasetId, onSelectEntry }: { datasetId: string; onSelectEntry: (e: Entry) => void }) {
  const { getDatasetById } = useAppStore();
  const [open, setOpen]     = useState(false);
  const [filter, setFilter] = useState('');
  const ds = getDatasetById(datasetId);
  if (!ds) return null;

  const trainCount = ds.entries.filter((e) => e.split === 'train').length;
  const valCount   = ds.entries.filter((e) => e.split === 'val').length;
  const splitLabel = ds.role === 'training'
    ? ` · ${trainCount} train / ${valCount} val`
    : '';

  const filtered = ds.entries.filter(
    (e) =>
      e.subjectId.toLowerCase().includes(filter.toLowerCase()) ||
      e.diagnosis.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <Card padding={false}>
      {/* Foldable header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{ds.name}</span>
            <Badge variant={ds.role === 'training' ? 'researcher' : 'info'}>
              {ds.role}
            </Badge>
            <Badge variant="default">{ds.modalities.join(', ')}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {ds.entries.length} entries{splitLabel} · {ds.description}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={clsx('text-slate-400 shrink-0 ml-3 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-slate-100">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <input
              type="text"
              placeholder="Filter by subject ID or diagnosis…"
              className="w-full max-w-sm border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="overflow-auto" style={{ maxHeight: '320px' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  {['Subject', 'Session', 'Date', 'Age', 'Sex', 'Diagnosis', 'Modality', ds.role === 'training' ? 'Split' : '', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{entry.subjectId}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{entry.sessionId}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{entry.date}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.age}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.sex}</td>
                    <td className="px-3 py-2"><LabelBadge label={entry.diagnosis} /></td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{entry.modalityType}</td>
                    {ds.role === 'training' && (
                      <td className="px-3 py-2">
                        <span className={clsx(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                          entry.split === 'train' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700',
                        )}>
                          {entry.split ?? '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="sm" onClick={() => onSelectEntry(entry)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function EntryDetailModal({
  entry,
  datasetId,
  labelSet,
  isResearcher,
  onClose,
}: {
  entry: Entry;
  datasetId: string;
  labelSet: string[];
  isResearcher: boolean;
  onClose: () => void;
}) {
  const { updateEntry } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...entry });

  const handleSave = () => {
    updateEntry(datasetId, entry.id, form);
    setEditing(false);
  };

  const field = (label: string, key: keyof Entry, type: 'text' | 'number' | 'select', options?: string[]) => (
    <div key={key}>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {editing && isResearcher ? (
        type === 'select' ? (
          <select
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={String(form[key])}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          >
            {options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={String(form[key])}
            onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          />
        )
      ) : (
        <p className="text-sm text-slate-800 font-mono">{String(entry[key])}</p>
      )}
    </div>
  );

  return (
    <Modal
      title={`Entry — ${entry.subjectId} / ${entry.sessionId}`}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          {isResearcher && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit2 size={12} /> Edit
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ ...entry }); }}>
                <X size={12} /> Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                <Check size={12} /> Save
              </Button>
            </>
          )}
          {!editing && <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>}
        </>
      }
    >
      <div className="flex gap-5">
        <div className="shrink-0 w-40">
          <MedicalImagePlaceholder modalityType={entry.modalityType} subjectId={entry.subjectId} className="w-40 h-40" />
          <p className="text-[10px] text-slate-400 text-center mt-1">{entry.imagePath}</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
          {field('Subject ID', 'subjectId', 'text')}
          {field('Session ID', 'sessionId', 'text')}
          {field('Date', 'date', 'text')}
          {field('Age', 'age', 'number')}
          {field('Sex', 'sex', 'select', ['M', 'F'])}
          {field('Modality', 'modalityType', 'select', ['MRI', 'ECG', 'CT', 'Pathology', 'Clinical Note', 'X-Ray'])}
          <div className="col-span-2">
            {field('Ground Truth Diagnosis', 'diagnosis', 'select', labelSet)}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Models page ───────────────────────────────────────────────────────────────

export function ModelsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectById, modelSpecs, getUserById, currentUser } = useAppStore();
  const project = getProjectById(projectId ?? '');
  const [showUpload, setShowUpload] = useState(false);

  if (!project) return null;
  const specs = modelSpecs.filter((m) => project.modelSpecIds.includes(m.id));

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-700">{specs.length} model specification{specs.length !== 1 ? 's' : ''}</h2>
        {currentUser?.role === 'researcher' && (
          <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
            + Upload Model
          </Button>
        )}
      </div>

      {specs.map((spec) => {
        const uploader = getUserById(spec.uploadedBy);
        let parsed: Record<string, unknown> | null = null;
        try { parsed = JSON.parse(spec.architecture); } catch { /* ok */ }

        return (
          <Card key={spec.id} padding={false}>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-800">{spec.name}</h3>
                    <Badge variant="info">{spec.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{spec.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Uploaded by {uploader?.name ?? spec.uploadedBy} · {new Date(spec.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Architecture */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Architecture</p>
                {parsed ? (
                  <div className="space-y-1">
                    {Object.entries(parsed).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="text-slate-400 font-mono w-32 shrink-0">{k}</span>
                        <span className="text-slate-700 font-mono">
                          {Array.isArray(v) ? v.join(' → ') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-xs text-slate-700 bg-slate-50 rounded p-2 overflow-auto max-h-32">{spec.architecture}</pre>
                )}
              </div>

              {/* Parameters */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Training Parameters</p>
                <div className="space-y-1">
                  {Object.entries(spec.parameters).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="text-slate-400 font-mono w-32 shrink-0">{k}</span>
                      <span className="text-slate-700 font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weight snapshots */}
            <div className="p-4 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Saved Weights ({spec.savedWeights.length})
              </p>
              <div className="space-y-2">
                {spec.savedWeights.map((w) => (
                  <div key={w.id} className="flex items-start gap-3 bg-slate-50 rounded p-2.5">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700">{w.name}</p>
                      <p className="text-[11px] text-slate-500">{w.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{w.filePath}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(w.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

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

// ── Evaluations list page ─────────────────────────────────────────────────────

export function EvaluationsListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProjectById, evaluations, getModelSpecById, getDatasetById, getUserById } = useAppStore();

  const project = getProjectById(projectId ?? '');
  if (!project) return null;
  const projEvals = evaluations.filter((e) => e.projectId === project.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-emerald-600' : s === 'running' ? 'text-blue-500' : s === 'failed' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="space-y-4">
      <ProjectHeader />
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
              const failures = ev.entryResults.filter((r) => r.predictedLabel !== r.trueLabel).length;

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
                      <div className="shrink-0 ml-4 text-right">
                        <p className={`text-base font-bold font-mono ${ev.metrics.accuracy >= 0.85 ? 'text-emerald-600' : ev.metrics.accuracy >= 0.75 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {(ev.metrics.accuracy * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-400">{failures} failure{failures !== 1 ? 's' : ''}</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Training list page (researcher-only) ──────────────────────────────────────

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

// ── Review page ───────────────────────────────────────────────────────────────

export function ReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectById, getFlagsForProject, getEvaluationById } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'commented' | 'dismissed'>('all');

  const project = getProjectById(projectId ?? '');
  if (!project) return null;

  const allFlags = getFlagsForProject(project.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const filtered = statusFilter === 'all' ? allFlags : allFlags.filter((f) => f.status === statusFilter);

  const counts = {
    all: allFlags.length,
    open: allFlags.filter((f) => f.status === 'open').length,
    commented: allFlags.filter((f) => f.status === 'commented').length,
    dismissed: allFlags.filter((f) => f.status === 'dismissed').length,
  };

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex items-center gap-2">
        {(['all', 'open', 'commented', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize',
              statusFilter === s
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">No flags matching this filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((flag) => {
            const ev = getEvaluationById(flag.evaluationId);
            return (
              <FlagCard key={flag.id} flag={flag} experimentLabel={ev?.id} />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Members page ──────────────────────────────────────────────────────────────

export function MembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectById, getUserById, currentUser, evaluations, getFlagsForProject } = useAppStore();

  const project = getProjectById(projectId ?? '');
  if (!project) return null;

  return (
    <div className="space-y-4">
      <ProjectHeader />

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {project.members.length} member{project.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {project.members.map((member) => {
            const user = getUserById(member.userId);
            if (!user) return null;

            const isMe = user.id === currentUser?.id;
            const isCreator = user.id === project.createdBy;
            const memberExps = evaluations.filter(
              (e) => e.projectId === project.id && e.runBy === user.id,
            );
            const memberFlags = getFlagsForProject(project.id).filter(
              (f) => f.raisedBy === user.id,
            );

            return (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    user.role === 'researcher' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                    {isMe && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">You</span>
                    )}
                    {isCreator && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">Creator</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{user.affiliation}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">@{user.username}</p>
                </div>

                {/* Role badge */}
                <div className="shrink-0 text-right space-y-1.5">
                  <div>
                    <Badge variant={member.role === 'researcher' ? 'researcher' : 'practitioner'}>
                      {member.role === 'researcher' ? 'ML Researcher' : 'Practitioner'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end gap-3 text-[11px] text-slate-400">
                    {member.role === 'researcher' && (
                      <span>{memberExps.length} experiment{memberExps.length !== 1 ? 's' : ''} run</span>
                    )}
                    <span>{memberFlags.length} flag{memberFlags.length !== 1 ? 's' : ''} raised</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
