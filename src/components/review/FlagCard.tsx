import { useState } from 'react';
import { Flag, MessageSquare, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import type { Flag as FlagType } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Badge, LabelBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusBadge = (status: FlagType['status']) => {
  if (status === 'open') return <Badge variant="danger">Open</Badge>;
  if (status === 'commented') return <Badge variant="warning">Insight Added</Badge>;
  return <Badge variant="muted">Dismissed</Badge>;
};

interface Props {
  flag: FlagType;
  experimentLabel?: string;
}

export function FlagCard({ flag, experimentLabel }: Props) {
  const { currentUser, getUserById, addInsight, dismissFlag, getEvaluationById, getDatasetById } = useAppStore();
  const [showInsightForm, setShowInsightForm] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [expanded, setExpanded] = useState(flag.status !== 'dismissed');

  const raiser = getUserById(flag.raisedBy);
  const insightAuthor = flag.insight ? getUserById(flag.insight.providedBy) : undefined;
  const exp = getEvaluationById(flag.evaluationId);
  const result = exp?.entryResults.find((r) => r.entryId === flag.entryId);
  const dataset = exp ? getDatasetById(exp.datasetId) : undefined;

  const canAddInsight =
    currentUser?.role === 'practitioner' && flag.status === 'open' && !flag.insight;
  const canDismiss =
    flag.status !== 'dismissed' &&
    (currentUser?.role === 'researcher' ||
      (currentUser?.role === 'practitioner' && flag.raisedBy === currentUser.id));

  const handleInsightSubmit = () => {
    if (!insightText.trim() || !currentUser) return;
    addInsight(flag.id, {
      providedBy: currentUser.id,
      comment: insightText.trim(),
      createdAt: new Date().toISOString(),
    });
    setShowInsightForm(false);
    setInsightText('');
  };

  const borderColor =
    flag.status === 'open' ? 'border-l-red-400' :
    flag.status === 'commented' ? 'border-l-amber-400' :
    'border-l-slate-300';

  return (
    <div className={clsx('bg-white border border-slate-200 rounded-lg border-l-4 shadow-sm', borderColor)}>
      {/* Header */}
      <div
        className="flex items-start justify-between px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <Flag size={14} className={clsx('mt-0.5 shrink-0', flag.status === 'open' ? 'text-red-400' : flag.status === 'commented' ? 'text-amber-400' : 'text-slate-300')} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-slate-700 font-mono">{flag.subjectId}</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-500 font-mono">{flag.sessionId}</span>
              {result && (
                <>
                  <LabelBadge label={result.trueLabel} />
                  <span className="text-[10px] text-slate-400">→</span>
                  <LabelBadge label={result.predictedLabel} />
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              {experimentLabel && <span>{experimentLabel}</span>}
              {dataset && <span>· {dataset.name}</span>}
              <span>· Flagged by <span className="text-slate-500">{raiser?.name ?? flag.raisedBy}</span></span>
              <span>· {formatDate(flag.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {statusBadge(flag.status)}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Reason */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason</p>
            <p className="text-sm text-slate-700 leading-relaxed">{flag.reason}</p>
          </div>

          {/* Existing insight */}
          {flag.insight && (
            <div className="bg-amber-50 border border-amber-100 rounded p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare size={12} className="text-amber-600" />
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Clinical Insight</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{flag.insight.comment}</p>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {insightAuthor?.name ?? flag.insight.providedBy} · {formatDate(flag.insight.createdAt)}
              </p>
            </div>
          )}

          {/* Dismissed note */}
          {flag.status === 'dismissed' && flag.dismissedBy && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <XCircle size={11} />
              Dismissed by {getUserById(flag.dismissedBy)?.name ?? flag.dismissedBy}
              {flag.dismissedAt && ` · ${formatDate(flag.dismissedAt)}`}
            </div>
          )}

          {/* Insight form */}
          {canAddInsight && !showInsightForm && (
            <Button variant="outline" size="sm" onClick={() => setShowInsightForm(true)}>
              <MessageSquare size={12} />
              Add Clinical Insight
            </Button>
          )}

          {showInsightForm && (
            <div className="space-y-2 border border-amber-200 bg-amber-50 rounded p-3">
              <p className="text-xs font-semibold text-amber-800">Add Clinical Insight</p>
              <textarea
                className="w-full border border-amber-200 bg-white rounded p-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={4}
                placeholder="Share domain knowledge on why this case was misclassified and its potential clinical impact…"
                value={insightText}
                onChange={(e) => setInsightText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleInsightSubmit} disabled={!insightText.trim()}>
                  Submit
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowInsightForm(false); setInsightText(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {canDismiss && (
            <div className="pt-1">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" onClick={() => dismissFlag(flag.id)}>
                <XCircle size={12} />
                Dismiss flag
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
