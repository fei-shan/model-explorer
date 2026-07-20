import clsx from 'clsx';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'researcher' | 'practitioner';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<Variant, string> = {
  default:      'bg-slate-100 text-slate-700',
  success:      'bg-emerald-100 text-emerald-800',
  warning:      'bg-amber-100 text-amber-800',
  danger:       'bg-red-100 text-red-700',
  info:         'bg-blue-100 text-blue-800',
  muted:        'bg-slate-100 text-slate-500',
  researcher:   'bg-indigo-100 text-indigo-800',
  practitioner: 'bg-teal-100 text-teal-800',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

// Deterministic label color from the label string
const LABEL_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-red-100 text-red-800',
  'bg-purple-100 text-purple-800',
  'bg-cyan-100 text-cyan-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
];

export function LabelBadge({ label }: { label: string }) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) % LABEL_COLORS.length;
  return (
    <span className={clsx('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', LABEL_COLORS[hash])}>
      {label}
    </span>
  );
}
