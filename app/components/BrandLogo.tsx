import LOGO from '~/lib/logo-data.json';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

const CREAM = '#FBF7F2';

type MarkEl =
  | {t: 'edge'}
  | {t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string}
  | {t: 'path'; d: string; stroke: string; sw: number};

/** ロゴの部品。色の役割名（ink / red / cream）を実際の色に置き換える */
function paint(role: string) {
  if (role === 'ink') return 'currentColor';
  if (role === 'red') return 'var(--color-primary)';
  return CREAM;
}

function MarkShapes() {
  return (
    <>
      <path
        d={LOGO.EDGE}
        fill={paint('red')}
        stroke={paint('red')}
        strokeWidth={LOGO.EDGE_STROKE}
        strokeLinejoin="round"
      />
      {(LOGO.MARK as MarkEl[]).map((el, i) => {
        if (el.t === 'ellipse') {
          return <ellipse key={i} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill={paint(el.fill)} />;
        }
        if (el.t === 'path') {
          return (
            <path
              key={i}
              d={el.d}
              fill="none"
              stroke={paint(el.stroke)}
              strokeWidth={el.sw}
              strokeLinecap="round"
            />
          );
        }
        return null;
      })}
    </>
  );
}

/**
 * CANVASWEARSのシンボル「生地くん」。ピンキングばさみで切った生地の切れ端に顔。
 * 形の元データは app/lib/logo-data.json（Pencilファイル brand/canvaswears-brand.pen と同じ形）。
 */
export function CanvasMark({size = 28}: {size?: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <MarkShapes />
    </svg>
  );
}

/** シンボル＋文字（canvas は文字色、wears は朱）。文字は書体ではなく輪郭のデータで描く */
function CanvaswearsLogo({height}: {height: number}) {
  const {WORD} = LOGO;
  return (
    <svg
      height={height}
      width={(height * WORD.width) / WORD.height}
      viewBox={`0 0 ${WORD.width} ${WORD.height}`}
      role="img"
      aria-label="CANVASWEARS"
      style={{color: 'var(--color-text)', overflow: 'visible', display: 'block'}}
    >
      <MarkShapes />
      <path d={WORD.canvas.d} fill={paint('ink')} />
      <path d={WORD.wears.d} fill={paint('red')} />
    </svg>
  );
}

/**
 * ヘッダーとフッターに出すロゴ。
 * CANVASWEARSはシンボル＋2ウェイトの欧文、ほかのブランドは従来どおり字間を空けた文字だけ。
 */
export default function BrandLogo({
  brand,
  size = 'md',
}: {
  brand: PublicBrand;
  size?: 'md' | 'lg';
}) {
  if (brand.id === 'custom-print') {
    return <CanvaswearsLogo height={size === 'lg' ? 40 : 34} />;
  }

  const isBold = isBoldBrand(brand.id);
  return (
    <span
      className={clsx(
        'uppercase',
        size === 'lg'
          ? isBold
            ? 'text-3xl'
            : 'text-2xl'
          : isBold
            ? 'text-3xl md:text-4xl'
            : 'text-2xl md:text-3xl',
      )}
      style={{
        fontFamily: 'var(--font-heading)',
        color: 'var(--color-text)',
        fontWeight: 400,
        letterSpacing:
          size === 'lg' ? (isBold ? '0.3em' : '0.2em') : isBold ? '0.4em' : '0.25em',
      }}
    >
      {brand.name}
    </span>
  );
}
