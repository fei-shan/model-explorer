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


export function EvaluationListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProjectById, evaluations, getModelSpecById, getDatasetById, getUserById } = useAppStore();

  const project = getProjectById(projectId ?? '');
  if (!project) return null;
  const projEvals = evaluations.filter((e) => e.projectId === project.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-emerald-600' : s === 'running' ? 'text-blue-500' : s === 'failed' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <Card padding={false}>
        {projEvals.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">No evaluations yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projEvals.map((ev) => {
              const model    = getModelSpecById(ev.modelSpecId);
              const weights  = model?.savedWeights.find((w) => w.id === ev.weightsSnapshotId);
              const dataset  = getDatasetById(ev.datasetId);
              const runner   = getUserById(ev.runBy);
              const failures = ev.entryResults.filter((r) => r.predictedLabel !== r.trueLabel).length;

              return (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/projects/${project.id}/evaluations/${ev.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-600 group-hover:text-blue-600 transition-colors">{ev.id}</span>
                        <span className={`text-[10px] font-semibold uppercase ${statusColor(ev.status)}`}>{ev.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span>{model?.name}</span>
                        {weights && <span>· {weights.name}</span>}
                        <span>· {dataset?.name}</span>
                        <span>· by {runner?.name}</span>
                        <span>· {new Date(ev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {ev.status === 'completed' && (
                      <div className="shrink-0 ml-4 text-right">
                        <p className={`text-base font-bold font-mono ${ev.metrics.accuracy >= 0.85 ? 'text-emerald-600' : ev.metrics.accuracy >= 0.75 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {(ev.metrics.accuracy * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-400">{failures} failure{failures !== 1 ? 's' : ''}</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}