import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TrainingEpoch } from '../../types';
import { Card } from '../ui/Card';

interface Props {
  history: TrainingEpoch[];
}

export function TrainingHistoryChart({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Loss chart */}
      <Card>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Training & Validation Loss
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="epoch"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Epoch', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={36} />
            <Tooltip
              contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4 }}
              formatter={(v: number) => v.toFixed(3)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="valLoss"   name="Val Loss"   stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Accuracy chart */}
      <Card>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Validation Accuracy
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="epoch"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Epoch', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={36} domain={[0, 1]} />
            <Tooltip
              contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4 }}
              formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="valAccuracy" name="Val Accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
