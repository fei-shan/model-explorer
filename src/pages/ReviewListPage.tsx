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


export function ReviewListPage() {
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
            const ev = flag.evaluationId ? getEvaluationById(flag.evaluationId) : undefined;
            return (
              <FlagCard key={flag.id} flag={flag} experimentLabel={ev?.id} />
            );
          })}
        </div>
      )}
    </div>
  );
}