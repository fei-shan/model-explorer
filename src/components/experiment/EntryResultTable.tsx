import { useState } from 'react';
import { Flag, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { EntryResult, Flag as FlagType } from '../../types';
import { LabelBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  results: EntryResult[];
  evaluationId: string;
  showFull: boolean;
  onToggleFull: () => void;
  isResearcher: boolean;
}

export function EntryResultTable({ results, evaluationId, showFull, onToggleFull, isResearcher }: Props) {
  const { currentUser, addFlag, getFlagsForEvaluation } = useAppStore();
  const [flagTarget, setFlagTarget] = useState<EntryResult | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const flags = getFlagsForEvaluation(evaluationId);
  const flagsByEntry = new Map<string, FlagType[]>();
  flags.forEach((f) => {
    const arr = flagsByEntry.get(f.entryId) ?? [];
    arr.push(f);
    flagsByEntry.set(f.entryId, arr);
  });

  // Sort: failures first, then by subjectId
  const sorted = [...results].sort((a, b) => {
    const aFail = a.predictedLabel !== a.trueLabel ? 0 : 1;
    const bFail = b.predictedLabel !== b.trueLabel ? 0 : 1;
    return aFail - bFail || a.subjectId.localeCompare(b.subjectId);
  });

  const failures = results.filter((r) => r.predictedLabel !== r.trueLabel).length;

  const handleFlag = () => {
    if (!flagTarget || !currentUser || !flagReason.trim()) return;
    addFlag({
      entryId: flagTarget.entryId,
      subjectId: flagTarget.subjectId,
      sessionId: flagTarget.sessionId,
      evaluationId,
      raisedBy: currentUser.id,
      reason: flagReason.trim(),
      status: 'open',
    });
    setFlagTarget(null);
    setFlagReason('');
  };

  return (
    <div>
      {/* Subheader */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Patient-Level Results</h3>
          {failures > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertTriangle size={12} />
              {failures} failure{failures > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onToggleFull}>
          {showFull ? 'Summary view' : 'Full results'}
        </Button>
      </div>

      {!showFull ? (
        <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-lg">
          Full results hidden. Click <strong>Full results</strong> to view per-entry predictions.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {['Subject', 'Session', 'Age / Sex', 'True Label', 'Predicted', 'Confidence', '', 'Flags'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const isMatch = r.predictedLabel === r.trueLabel;
                const entryFlags = flagsByEntry.get(r.entryId) ?? [];
                const activeFlags = entryFlags.filter((f) => f.status !== 'dismissed');
                const alreadyFlagged = entryFlags.some((f) => f.raisedBy === currentUser?.id && f.status !== 'dismissed');

                return (
                  <tr
                    key={r.entryId}
                    className={clsx(
                      'border-b border-slate-100 transition-colors',
                      isMatch ? 'hover:bg-slate-50' : 'bg-red-50 hover:bg-red-100/60',
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{r.subjectId}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{r.sessionId}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">—</td>
                    <td className="px-3 py-2"><LabelBadge label={r.trueLabel} /></td>
                    <td className="px-3 py-2"><LabelBadge label={r.predictedLabel} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div
                            className={clsx('h-1.5 rounded-full', isMatch ? 'bg-emerald-500' : 'bg-red-400')}
                            style={{ width: `${r.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-600">{(r.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isMatch
                        ? <CheckCircle size={13} className="text-emerald-500 mx-auto" />
                        : <XCircle size={13} className="text-red-500 mx-auto" />}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {alreadyFlagged ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Flag size={11} className="fill-amber-400" />
                          <span className="text-[10px] font-medium">Flagged</span>
                          {activeFlags.length > 1 && <span className="text-[10px] text-slate-400">+{activeFlags.length - 1}</span>}
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setFlagTarget(r)}>
                          <Flag size={11} />
                          Flag
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Flag modal */}
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
              <div><span className="text-slate-500">True label:</span> {flagTarget.trueLabel}</div>
              <div><span className="text-slate-500">Predicted:</span> {flagTarget.predictedLabel}</div>
              <div><span className="text-slate-500">Confidence:</span> {(flagTarget.confidence * 100).toFixed(0)}%</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for flagging <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-slate-300 rounded p-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Describe why this entry warrants review (e.g., unusual presentation, potential data quality issue, clinical significance of misclassification)…"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
              />
            </div>
            {!isResearcher && (
              <p className="text-[11px] text-slate-500 bg-teal-50 border border-teal-100 rounded p-2">
                As a practitioner, you can flag entries based on clinical observations. The research team will review and respond.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
