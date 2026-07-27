import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export interface FlagSummaryField {
  label: string;
  value: string;
}

interface Props {
  summaryFields: FlagSummaryField[];
  reason: string;
  onReasonChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  placeholder?: string;
  practitionerNote?: string;
}

export function FlagModal({
  summaryFields,
  reason,
  onReasonChange,
  onSubmit,
  onClose,
  placeholder = 'Describe why this entry warrants review…',
  practitionerNote,
}: Props) {
  return (
    <Modal
      title="Flag Entry for Review"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={onSubmit} disabled={!reason.trim()}>
            Submit Flag
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1 font-mono">
          {summaryFields.map(({ label, value }) => (
            <div key={label}>
              <span className="text-slate-500">{label}:</span> {value}
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reason for flagging <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-slate-300 rounded p-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder={placeholder}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        {practitionerNote && (
          <p className="text-[11px] text-slate-500 bg-teal-50 border border-teal-100 rounded p-2">
            {practitionerNote}
          </p>
        )}
      </div>
    </Modal>
  );
}
