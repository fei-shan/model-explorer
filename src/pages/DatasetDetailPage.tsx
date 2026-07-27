import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, X, Flag } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { Badge, LabelBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { MedicalImagePlaceholder } from '../components/medical/MedicalImagePlaceholder';
import type { Entry, Flag as FlagType } from '../types';

export function DatasetDetailPage() {
  const { projectId, datasetId } = useParams<{ projectId: string; datasetId: string }>();
  const navigate = useNavigate();
  const { getDatasetById, currentUser, addFlag, getFlagsForDataset } = useAppStore();

  const [filter, setFilter]               = useState('');
  const [selectedEntry, setSelectedEntry]  = useState<Entry | null>(null);
  const [flagTarget, setFlagTarget]        = useState<Entry | null>(null);
  const [flagReason, setFlagReason]        = useState('');

  const ds = getDatasetById(datasetId ?? '');
  if (!ds) return <div className="text-sm text-slate-500 p-4">Dataset not found.</div>;

  const dsFlags = getFlagsForDataset(ds.id);
  const flagsByEntry = new Map<string, FlagType[]>();
  dsFlags.forEach((f) => {
    const arr = flagsByEntry.get(f.entryId) ?? [];
    arr.push(f);
    flagsByEntry.set(f.entryId, arr);
  });

  const handleFlag = () => {
    if (!flagTarget || !currentUser || !flagReason.trim()) return;
    addFlag({
      entryId: flagTarget.id,
      subjectId: flagTarget.subjectId,
      sessionId: flagTarget.sessionId,
      datasetId: ds.id,
      raisedBy: currentUser.id,
      reason: flagReason.trim(),
      status: 'open',
      insights: [],
    });
    setFlagTarget(null);
    setFlagReason('');
  };

  const trainCount = ds.entries.filter((e) => e.split === 'train').length;
  const valCount   = ds.entries.filter((e) => e.split === 'val').length;

  const filtered = ds.entries.filter(
    (e) =>
      e.subjectId.toLowerCase().includes(filter.toLowerCase()) ||
      e.diagnosis.toLowerCase().includes(filter.toLowerCase()),
  );

  const headers = ['Subject', 'Session', 'Date', 'Age', 'Sex', 'Diagnosis', 'Modality', ...(ds.role === 'training' ? ['Split'] : []), 'Flags', ''];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/datasets`)}>
          <ArrowLeft size={13} /> Datasets
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-800">{ds.name}</h2>
            <Badge variant={ds.role === 'training' ? 'researcher' : 'info'}>{ds.role}</Badge>
            <Badge variant="default">{ds.modalities.join(', ')}</Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{ds.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
          <p className="text-lg font-bold font-mono text-slate-800">{ds.entries.length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Entries</p>
        </div>
        {ds.role === 'training' && (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-center">
              <p className="text-lg font-bold font-mono text-blue-700">{trainCount}</p>
              <p className="text-[10px] text-blue-500 uppercase tracking-wider">Train</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-2.5 text-center">
              <p className="text-lg font-bold font-mono text-purple-700">{valCount}</p>
              <p className="text-[10px] text-purple-500 uppercase tracking-wider">Val</p>
            </div>
          </>
        )}
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
          <p className="text-sm font-semibold text-slate-700">{ds.labelSet.join(', ')}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Labels</p>
        </div>
      </div>

      {/* Filter + Table */}
      <Card padding={false}>
        <div className="px-4 py-2.5 border-b border-slate-100">
          <input
            type="text"
            placeholder="Filter by subject ID or diagnosis…"
            className="w-full max-w-sm border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-3 py-8 text-center text-slate-400">No entries match your filter.</td>
                </tr>
              ) : (
                filtered.map((entry) => (
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
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(() => {
                        const entryFlags = flagsByEntry.get(entry.id) ?? [];
                        const activeFlags = entryFlags.filter((f) => f.status !== 'dismissed');
                        const alreadyFlagged = entryFlags.some((f) => f.raisedBy === currentUser?.id && f.status !== 'dismissed');
                        return alreadyFlagged ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Flag size={11} className="fill-amber-400" />
                            <span className="text-[10px] font-medium">Flagged</span>
                            {activeFlags.length > 1 && <span className="text-[10px] text-slate-400">+{activeFlags.length - 1}</span>}
                          </span>
                        ) : (
                          <button
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            onClick={() => setFlagTarget(entry)}
                            title="Flag this entry"
                          >
                            <Flag size={11} />
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          datasetId={ds.id}
          labelSet={ds.labelSet}
          isResearcher={currentUser?.role === 'researcher'}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {flagTarget && (
        <Modal
          title="Flag Entry for Review"
          onClose={() => { setFlagTarget(null); setFlagReason(''); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => { setFlagTarget(null); setFlagReason(''); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleFlag} disabled={!flagReason.trim()}>
                Submit Flag
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1 font-mono">
              <div><span className="text-slate-500">Subject:</span> {flagTarget.subjectId}</div>
              <div><span className="text-slate-500">Session:</span> {flagTarget.sessionId}</div>
              <div><span className="text-slate-500">Diagnosis:</span> {flagTarget.diagnosis}</div>
              <div><span className="text-slate-500">Age / Sex:</span> {flagTarget.age} / {flagTarget.sex}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for flagging <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-slate-300 rounded p-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Describe why this entry warrants review (e.g., potential labelling error, data quality issue, unusual presentation)…"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
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
