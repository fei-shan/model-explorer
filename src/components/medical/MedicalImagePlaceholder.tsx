import type { ModalityType } from '../../types';

// Deterministic pseudo-random from seed
function prng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function MRIPlaceholder({ subjectId }: { subjectId: string }) {
  const rand = prng(hashStr(subjectId));
  const cx = 100 + (rand() - 0.5) * 6;
  const cy = 102 + (rand() - 0.5) * 6;
  const asymR = rand() * 3;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ background: '#0a0a0a' }}>
      {/* Skull outline */}
      <ellipse cx="100" cy="100" rx="85" ry="80" fill="#2a2a2a" />
      {/* Brain tissue */}
      <ellipse cx={cx} cy={cy} rx={65 + asymR} ry={60} fill="#444" />
      {/* Cortical surface detail */}
      <ellipse cx={cx - 10} cy={cy - 5} rx={40} ry={38} fill="#525252" />
      <ellipse cx={cx + 12} cy={cy - 2} rx={35 + asymR} ry={33} fill="#4e4e4e" />
      {/* Ventricles */}
      <ellipse cx={cx - 8} cy={cy + 8} rx={9} ry={13} fill="#222" />
      <ellipse cx={cx + 8} cy={cy + 8} rx={8 + asymR * 0.5} ry={12} fill="#222" />
      {/* Midline */}
      <line x1="100" y1="22" x2="100" y2="178" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="3,3" />
      {/* Modality label */}
      <text x="100" y="192" textAnchor="middle" fontSize="9" fill="#555" fontFamily="monospace">T1w MRI</text>
    </svg>
  );
}

function ECGPlaceholder({ subjectId }: { subjectId: string }) {
  const rand = prng(hashStr(subjectId));
  // Build a P-QRS-T waveform across 300px
  const baseline = 75;
  const noise = () => (rand() - 0.5) * 4;
  const points: string[] = [];

  // Flat lead-in
  for (let x = 0; x <= 30; x += 5) points.push(`${x},${baseline + noise()}`);
  // P wave
  points.push(`40,${baseline - 8 + noise()}`);
  points.push(`50,${baseline - 14 + noise()}`);
  points.push(`60,${baseline - 8 + noise()}`);
  // PR segment
  points.push(`70,${baseline + noise()}`);
  points.push(`80,${baseline + noise()}`);
  // Q
  points.push(`84,${baseline + 5 + noise()}`);
  // R (tall spike)
  points.push(`88,${baseline - 35 - rand() * 10}`);
  // S
  points.push(`92,${baseline + 10 + noise()}`);
  // ST segment
  points.push(`100,${baseline + noise()}`);
  points.push(`115,${baseline + noise()}`);
  // T wave
  points.push(`125,${baseline - 10 + noise()}`);
  points.push(`135,${baseline - 16 + noise()}`);
  points.push(`145,${baseline - 10 + noise()}`);
  // Flat
  for (let x = 155; x <= 300; x += 15) points.push(`${x},${baseline + noise()}`);

  return (
    <svg viewBox="0 0 300 150" width="100%" height="100%" style={{ background: '#030d1a' }}>
      {/* Grid lines */}
      {[25, 50, 75, 100, 125].map((y) => (
        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#0a2a1a" strokeWidth="0.5" />
      ))}
      {[0, 50, 100, 150, 200, 250, 300].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="150" stroke="#0a2a1a" strokeWidth="0.5" />
      ))}
      {/* Baseline */}
      <line x1="0" y1={baseline} x2="300" y2={baseline} stroke="#0d3320" strokeWidth="0.5" />
      {/* ECG trace */}
      <polyline points={points.join(' ')} fill="none" stroke="#00d48a" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="6" y="144" fontSize="8" fill="#1a4a2a" fontFamily="monospace">12-Lead ECG</text>
    </svg>
  );
}

function ClinicalNotePlaceholder({ subjectId }: { subjectId: string }) {
  const rand = prng(hashStr(subjectId));
  const lines = Array.from({ length: 10 }, (_, i) => {
    const w = 40 + rand() * 55;
    const short = rand() > 0.7;
    return { y: 30 + i * 16, w: short ? w * 0.5 : w };
  });
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ background: '#fafafa' }}>
      {/* Paper */}
      <rect x="15" y="10" width="170" height="180" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      {/* Header bar */}
      <rect x="15" y="10" width="170" height="18" rx="2" fill="#1e3a5f" />
      <rect x="15" y="22" width="170" height="6" fill="#1e3a5f" />
      <text x="100" y="22" textAnchor="middle" fontSize="7" fill="white" fontFamily="monospace">RADIOLOGY REPORT</text>
      {/* Text lines */}
      {lines.map((l, i) => (
        <rect key={i} x="25" y={l.y} width={l.w} height="5" rx="1" fill="#cbd5e1" />
      ))}
      {/* Signature line */}
      <line x1="25" y1="185" x2="110" y2="185" stroke="#94a3b8" strokeWidth="0.5" />
      <text x="25" y="193" fontSize="6" fill="#94a3b8" fontFamily="monospace">Signed</text>
    </svg>
  );
}

interface Props {
  modalityType: ModalityType;
  subjectId: string;
  className?: string;
}

export function MedicalImagePlaceholder({ modalityType, subjectId, className }: Props) {
  return (
    <div className={`rounded overflow-hidden ${className ?? 'w-full aspect-square'}`}>
      {modalityType === 'MRI' || modalityType === 'CT' || modalityType === 'X-Ray' || modalityType === 'Pathology'
        ? <MRIPlaceholder subjectId={subjectId} />
        : modalityType === 'ECG'
        ? <ECGPlaceholder subjectId={subjectId} />
        : <ClinicalNotePlaceholder subjectId={subjectId} />}
    </div>
  );
}
