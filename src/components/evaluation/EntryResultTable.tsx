import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { EntryResult, AnyEntryResult, ClusteringEntryResult, LLMEntryResult, Flag as FlagType, ModelType } from '../../types';
import { LabelBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FlagCell } from '../review/FlagCell';
import { FlagModal } from '../review/FlagModal';
import { useAppStore } from '../../store/useAppStore';
import { isEntryResultCorrect } from '../../utils/entryResults';

interface Props {
  results: AnyEntryResult[];
  modelType: ModelType;
  evaluationId: string;
  showFull: boolean;
  onToggleFull: () => void;
  isResearcher: boolean;
}

export function EntryResultTable({ results, modelType, evaluationId, showFull, onToggleFull, isResearcher }: Props) {
  if (modelType === 'clustering')
    return <ClusteringTable results={results as ClusteringEntryResult[]} showFull={showFull} onToggleFull={onToggleFull} />;
  if (modelType === 'llm-finetuning')
    return <LLMTable results={results as LLMEntryResult[]} evaluationId={evaluationId} showFull={showFull} onToggleFull={onToggleFull} isResearcher={isResearcher} />;
  return <ClassificationTable results={results as EntryResult[]} modelType={modelType} evaluationId={evaluationId} showFull={showFull} onToggleFull={onToggleFull} isResearcher={isResearcher} />;
}

function ClassificationTable({ results, modelType, evaluationId, showFull, onToggleFull, isResearcher }: { results: EntryResult[]; modelType: ModelType; evaluationId: string; showFull: boolean; onToggleFull: () => void; isResearcher: boolean }) {
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
    const aFail = isEntryResultCorrect(a, modelType) ? 1 : 0;
    const bFail = isEntryResultCorrect(b, modelType) ? 1 : 0;
    return aFail - bFail || a.subjectId.localeCompare(b.subjectId);
  });

  const failures = results.filter((r) => !isEntryResultCorrect(r, modelType)).length;

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
      insights: [],
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
                const isMatch = isEntryResultCorrect(r, modelType);
                const entryFlags = flagsByEntry.get(r.entryId) ?? [];

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
                      <FlagCell
                        flags={entryFlags}
                        currentUserId={currentUser?.id}
                        onFlag={() => setFlagTarget(r)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {flagTarget && (
        <FlagModal
          summaryFields={[
            { label: 'Subject', value: flagTarget.subjectId },
            { label: 'Session', value: flagTarget.sessionId },
            { label: 'True label', value: flagTarget.trueLabel },
            { label: 'Predicted', value: flagTarget.predictedLabel },
            { label: 'Confidence', value: `${(flagTarget.confidence * 100).toFixed(0)}%` },
          ]}
          reason={flagReason}
          onReasonChange={setFlagReason}
          onSubmit={handleFlag}
          onClose={() => { setFlagTarget(null); setFlagReason(''); }}
          placeholder="Describe why this entry warrants review (e.g., unusual presentation, potential data quality issue, clinical significance of misclassification)…"
          practitionerNote={!isResearcher ? 'As a practitioner, you can flag entries based on clinical observations. The research team will review and respond.' : undefined}
        />
      )}
    </div>
  );
}

// ── Clustering Table ───────────────────────────────────────────────────────────
const CLUSTER_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

function ClusteringTable({
  results,
  showFull,
  onToggleFull,
}: {
  results: ClusteringEntryResult[];
  showFull: boolean;
  onToggleFull: () => void;
}) {
  const sorted = [...results].sort((a, b) => b.silhouetteScore - a.silhouetteScore);
  const maxDist = Math.max(...results.map((r) => r.distanceToCentroid), 0.001);

  const silColor = (s: number) =>
    s >= 0.5 ? 'text-emerald-600' : s >= 0.25 ? 'text-blue-600' : s >= 0 ? 'text-amber-600' : 'text-red-600';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Entry-Level Cluster Assignments</h3>
        <Button variant="outline" size="sm" onClick={onToggleFull}>
          {showFull ? 'Summary view' : 'Full results'}
        </Button>
      </div>

      {!showFull ? (
        <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-lg">
          Full results hidden. Click <strong>Full results</strong> to view per-entry cluster assignments.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {['Subject', 'Session', 'Cluster', 'Distance to Centroid', 'Silhouette Score'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.entryId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{r.subjectId}</td>
                  <td className="px-3 py-2 font-mono text-slate-500">{r.sessionId}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${CLUSTER_COLORS[r.clusterId % CLUSTER_COLORS.length]}`}>
                      Cluster {r.clusterId}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-indigo-400"
                          style={{ width: `${(r.distanceToCentroid / maxDist) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-600">{r.distanceToCentroid.toFixed(3)}</span>
                    </div>
                  </td>
                  <td className={`px-3 py-2 font-mono font-semibold ${silColor(r.silhouetteScore)}`}>
                    {r.silhouetteScore.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── LLM Table ─────────────────────────────────────────────────────────────────
function LLMTable({
  results,
  evaluationId,
  showFull,
  onToggleFull,
  isResearcher,
}: {
  results: LLMEntryResult[];
  evaluationId: string;
  showFull: boolean;
  onToggleFull: () => void;
  isResearcher: boolean;
}) {
  const { currentUser, addFlag, getFlagsForEvaluation } = useAppStore();
  const [flagTarget, setFlagTarget] = useState<LLMEntryResult | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const flags = getFlagsForEvaluation(evaluationId);
  const flagsByEntry = new Map<string, FlagType[]>();
  flags.forEach((f) => {
    const arr = flagsByEntry.get(f.entryId) ?? [];
    arr.push(f);
    flagsByEntry.set(f.entryId, arr);
  });

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
      insights: [],
    });
    setFlagTarget(null);
    setFlagReason('');
  };

  const scoreColor = (v: number) =>
    v >= 0.6 ? 'text-emerald-600' : v >= 0.35 ? 'text-blue-600' : 'text-amber-600';

  const truncate = (s: string, max = 60) => (s.length > max ? s.slice(0, max) + '…' : s);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Generation Results</h3>
        <Button variant="outline" size="sm" onClick={onToggleFull}>
          {showFull ? 'Summary view' : 'Full results'}
        </Button>
      </div>

      {!showFull ? (
        <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-lg">
          Full results hidden. Click <strong>Full results</strong> to view per-entry generated text.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {['Subject', 'Prompt', 'Reference', 'Generated', 'ROUGE-L', 'BLEU', 'Flags'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const entryFlags = flagsByEntry.get(r.entryId) ?? [];
                return (
                  <tr key={r.entryId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{r.subjectId}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-[140px]" title={r.prompt}>{truncate(r.prompt)}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[140px]" title={r.referenceCompletion}>{truncate(r.referenceCompletion)}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[160px]" title={r.generatedCompletion}>{truncate(r.generatedCompletion)}</td>
                    <td className={`px-3 py-2 font-mono font-semibold ${scoreColor(r.rougeL)}`}>{r.rougeL.toFixed(3)}</td>
                    <td className={`px-3 py-2 font-mono font-semibold ${scoreColor(r.bleu)}`}>{r.bleu.toFixed(3)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <FlagCell
                        flags={entryFlags}
                        currentUserId={currentUser?.id}
                        onFlag={() => setFlagTarget(r)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {flagTarget && (
        <FlagModal
          summaryFields={[
            { label: 'Subject', value: flagTarget.subjectId },
            { label: 'Session', value: flagTarget.sessionId },
            { label: 'Prompt', value: truncate(flagTarget.prompt, 80) },
            { label: 'Generated', value: truncate(flagTarget.generatedCompletion, 80) },
          ]}
          reason={flagReason}
          onReasonChange={setFlagReason}
          onSubmit={handleFlag}
          onClose={() => { setFlagTarget(null); setFlagReason(''); }}
          placeholder="Describe why this generated output warrants review (e.g., factual error, missing critical finding, inappropriate clinical language)…"
          practitionerNote={!isResearcher ? 'As a practitioner, you can flag concerning model outputs. The research team will review and respond.' : undefined}
        />
      )}
    </div>
  );
}
