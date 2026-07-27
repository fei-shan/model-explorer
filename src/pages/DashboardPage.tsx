import { useNavigate } from 'react-router-dom';
import { Database, FlaskConical, Users, Flag, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';

export function DashboardPage() {
  const { currentUser, getAccessibleProjects, evaluations, getFlagsForProject, datasets } = useAppStore();
  const navigate = useNavigate();
  const projects = getAccessibleProjects();

  const totalEvaluations = evaluations.filter((e) => projects.some((p) => p.id === e.projectId)).length;
  const allFlags = projects.flatMap((p) => getFlagsForProject(p.id));
  const openFlags = allFlags.filter((f) => f.status !== 'dismissed').length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">My Projects</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Showing {projects.length} project{projects.length !== 1 ? 's' : ''} accessible to{' '}
          <span className="font-medium text-slate-700">{currentUser?.name}</span>
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Projects', value: projects.length, icon: <FlaskConical size={14} /> },
          { label: 'Datasets',     value: datasets.filter((d) => projects.some((p) => p.datasetIds.includes(d.id))).length, icon: <Database size={14} /> },
          { label: 'Evaluations',  value: totalEvaluations, icon: <FlaskConical size={14} /> },
          { label: 'Open Flags',   value: openFlags, icon: <Flag size={14} />, highlight: openFlags > 0 },
        ].map(({ label, value, icon, highlight }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className={highlight ? 'text-amber-500' : 'text-slate-400'}>{icon}</span>
            <div>
              <p className="text-lg font-bold text-slate-800">{value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => {
          const projEvals = evaluations.filter((e) => e.projectId === project.id);
          const latestEval = projEvals.at(-1);
          const projFlags  = getFlagsForProject(project.id).filter((f) => f.status !== 'dismissed');
          const myRole     = project.members.find((m) => m.userId === currentUser?.id)?.role;

          return (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}/evaluations`)}
              className="text-left bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant="info" className="text-[10px]">{project.domain}</Badge>
                <div className="flex items-center gap-1.5">
                  {myRole && (
                    <Badge variant={myRole === 'researcher' ? 'researcher' : 'practitioner'}>
                      {myRole === 'researcher' ? 'Researcher' : 'Practitioner'}
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors mb-1.5 leading-tight">
                {project.name}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                {project.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Database size={11} />{project.datasetIds.length}</span>
                <span className="flex items-center gap-1"><FlaskConical size={11} />{projEvals.length} eval</span>
                <span className="flex items-center gap-1"><Users size={11} />{project.members.length}</span>
                {projFlags.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Flag size={11} />{projFlags.length} flag{projFlags.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {latestEval && latestEval.status === 'completed' && (
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    Latest eval: <span className="text-slate-600 font-mono">{latestEval.id}</span>
                  </div>
                  <div className={`text-xs font-bold font-mono ${(latestEval.metrics.accuracy ?? 0) >= 0.85 ? 'text-emerald-600' : (latestEval.metrics.accuracy ?? 0) >= 0.75 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {latestEval.metrics.accuracy !== undefined ? `${(latestEval.metrics.accuracy * 100).toFixed(1)}% acc` : `ppl ${latestEval.metrics.perplexity?.toFixed(1) ?? '—'}`}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-blue-500 mt-3 group-hover:gap-2 transition-all">
                <span>View project</span>
                <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
