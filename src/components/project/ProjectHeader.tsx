import { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeft, Database, Brain, FlaskConical, Flag, Users, Calendar, Edit2, Check, X, GraduationCap, Plus, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { Badge, LabelBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { MedicalImagePlaceholder } from '../medical/MedicalImagePlaceholder';
import { FlagCard } from '../review/FlagCard';
import type { Entry } from '../../types';

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


