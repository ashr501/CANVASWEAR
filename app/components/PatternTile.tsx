import type {CSSProperties} from 'react';

export type PatternKind = 'dots' | 'stripes' | 'wave' | 'diamond' | 'arc';
type Tone = 'red' | 'ink' | 'sand';

const TONES: Record<Tone, {bg: string; fg: string; sub: string}> = {
  red: {bg: 'var(--color-primary)', fg: '#FBF7F2', sub: '#1F1B18'},
  ink: {bg: '#1F1B18', fg: '#FBF7F2', sub: 'var(--color-primary)'},
  sand: {bg: 'var(--color-hero-bg)', fg: 'var(--color-primary)', sub: '#1F1B18'},
};

/**
 * 柄のタイル。CANVASWEARSの飾りはすべてこれで作る（ロゴ「柄タイル」と同じ考え方）。
 * 「どんな柄でもプリントできる」ことを、写真に頼らず画面のあちこちで見せるためのもの。
 * 意味を持たない飾りなので、読み上げからは外している。
 */
export default function PatternTile({
  kind,
  tone = 'red',
  size = 72,
  className,
  style,
}: {
  kind: PatternKind;
  tone?: Tone;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const {bg, fg, sub} = TONES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{borderRadius: '22%', ...style}}
    >
      <rect width="48" height="48" fill={bg} />
      {kind === 'dots' &&
        [8, 24, 40].flatMap((y, row) =>
          [8, 24, 40].map((x, col) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill={(row + col) % 2 ? sub : fg} />
          )),
        )}
      {kind === 'stripes' &&
        [-36, -12, 12, 36].map((x, i) => (
          <rect
            key={x}
            x={x + 12}
            y="-20"
            width="10"
            height="90"
            fill={i % 2 ? sub : fg}
            transform="rotate(35 24 24)"
          />
        ))}
      {kind === 'wave' &&
        [10, 24, 38].map((y, i) => (
          <path
            key={y}
            d={`M-4 ${y}Q4 ${y - 9} 12 ${y}T28 ${y}T44 ${y}T60 ${y}`}
            fill="none"
            stroke={i === 1 ? sub : fg}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        ))}
      {kind === 'diamond' && (
        <>
          <path d="M24 5L43 24L24 43L5 24Z" fill={fg} />
          <path d="M24 15L33 24L24 33L15 24Z" fill={sub} />
        </>
      )}
      {kind === 'arc' && (
        <>
          <path d="M0 48A48 48 0 0 1 48 0V48Z" fill={fg} />
          <path d="M20 48A28 28 0 0 1 48 20V48Z" fill={sub} />
        </>
      )}
    </svg>
  );
}
