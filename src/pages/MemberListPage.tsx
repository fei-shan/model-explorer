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


export function MemberListPage() {
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
