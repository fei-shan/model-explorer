import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, Database, Brain, FlaskConical, Flag, Users, ChevronRight, GraduationCap } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';

const navItem = (to: string, icon: React.ReactNode, label: string, badge?: number) => (
  <NavLink
    key={to}
    to={to}
    className={({ isActive }) =>
      clsx(
        'flex items-center justify-between gap-2.5 px-3 py-2 rounded text-sm transition-colors',
        isActive
          ? 'bg-slate-700 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
      )
    }
  >
    <span className="flex items-center gap-2.5">
      {icon}
      {label}
    </span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-amber-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
        {badge}
      </span>
    )}
  </NavLink>
);

export function Sidebar() {
  const { projectId } = useParams<{ projectId?: string }>();
  const { getProjectById, getFlagsForProject, currentUser } = useAppStore();

  const project = projectId ? getProjectById(projectId) : undefined;
  const openFlagCount = projectId
    ? getFlagsForProject(projectId).filter((f) => f.status !== 'dismissed').length
    : 0;

  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-blue-400" />
          <div>
            <p className="text-xs font-bold text-white tracking-wide uppercase">MES</p>
            <p className="text-[10px] text-slate-500 leading-none">Model Exploration</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Global */}
        {navItem('/dashboard', <LayoutDashboard size={15} />, 'Dashboard')}

        {/* Project section */}
        {project && (
          <>
            <div className="pt-4 pb-1 px-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                <ChevronRight size={11} />
                <span className="truncate">{project.name}</span>
              </div>
            </div>
            {navItem(`/projects/${project.id}/datasets`,    <Database size={15} />,      'Datasets')}
            {navItem(`/projects/${project.id}/models`,       <Brain size={15} />,          'Models')}
            {currentUser?.role === 'researcher' &&
              navItem(`/projects/${project.id}/training`,    <GraduationCap size={15} />,  'Training')}
            {navItem(`/projects/${project.id}/evaluations`,  <FlaskConical size={15} />,   'Evaluations')}
            {navItem(`/projects/${project.id}/review`,       <Flag size={15} />,           'Review', openFlagCount)}
            {navItem(`/projects/${project.id}/members`,      <Users size={15} />,          'Members')}
          </>
        )}
      </nav>

      {/* Version */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-600">v0.1.0-demo · UNC</p>
      </div>
    </aside>
  );
}
