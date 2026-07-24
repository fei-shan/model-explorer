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
import { ProjectHeader } from '../components/project/ProjectHeader';

export function DatasetListPage() {
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