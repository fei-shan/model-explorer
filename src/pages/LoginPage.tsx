import { useNavigate } from 'react-router-dom';
import { Brain, FlaskConical, User, Building2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/ui/Badge';

export function LoginPage() {
  const { users, login } = useAppStore();
  const navigate = useNavigate();

  const handleSelect = (userId: string) => {
    login(userId);
    navigate('/dashboard');
  };

  const researchers = users.filter((u) => u.role === 'researcher');
  const practitioners = users.filter((u) => u.role === 'practitioner');

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-80 bg-slate-950 flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <Brain size={22} className="text-blue-400" />
            <div>
              <p className="text-sm font-bold text-white tracking-wide">MES</p>
              <p className="text-[10px] text-slate-500">Model Exploration System</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight mb-3">
            Clinical AI<br />Research Platform
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Explore, evaluate, and collaborate on machine learning models with multi-modal biomedical data.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: <FlaskConical size={15} />, text: 'Experiment tracking & evaluation' },
            { icon: <User size={15} />, text: 'Role-based researcher & clinician views' },
            { icon: <Building2 size={15} />, text: 'University of North Carolina' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-slate-400 text-xs">
              <span className="text-slate-600">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-1.5">Select your profile</h2>
            <p className="text-sm text-slate-400">
              This is a demo prototype. Choose a user to continue.
            </p>
          </div>

          <div className="space-y-4">
            {/* Researchers */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                ML Researchers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {researchers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id)}
                    className="text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-lg p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center text-indigo-300 text-xs font-bold">
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <Badge variant="researcher">Researcher</Badge>
                    </div>
                    <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{u.affiliation}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Practitioners */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Clinical Practitioners
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {practitioners.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id)}
                    className="text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 rounded-lg p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-teal-900 rounded-full flex items-center justify-center text-teal-300 text-xs font-bold">
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <Badge variant="practitioner">Practitioner</Badge>
                    </div>
                    <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{u.affiliation}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 mt-8 text-center">
            Demo prototype · Synthetic data only · No PHI
          </p>
        </div>
      </div>
    </div>
  );
}
