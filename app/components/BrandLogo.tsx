import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

/**
 * CANVASWEARSのシンボル「柄タイル」。水玉・曲線・しま・ひし形の4つの柄で
 * 「どんな柄でも」を表す。墨色のタイルは文字色に合わせるので、暗い背景でも使える。
 * 形の元データは brand/marks.mjs（Pencilファイルと書き出しSVGも同じ形）。
 */
export function CanvasMark({size = 28}: {size?: number}) {
  const ink = 'currentColor';
  const red = 'var(--color-primary)';
  // 柄の抜き色。ロゴを置く場所の地色に合わせる
  const paper = 'var(--color-surface)';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      style={{flexShrink: 0}}
    >
      <rect width="18" height="18" rx="4.5" fill={red} />
      <circle cx="9" cy="9" r="4.2" fill={paper} />
      <rect x="22" width="18" height="18" rx="4.5" fill={ink} />
      <path d="M26 18A14 14 0 0 1 40 4V18Z" fill={paper} />
      <rect y="22" width="18" height="18" rx="4.5" fill={ink} />
      <rect x="4" y="27" width="10" height="2.6" rx="1.3" fill={paper} />
      <rect x="4" y="33" width="10" height="2.6" rx="1.3" fill={paper} />
      <rect x="22" y="22" width="18" height="18" rx="4.5" fill={red} />
      <path d="M31 26.5L35.5 31L31 35.5L26.5 31Z" fill={paper} />
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
    return (
      <span
        className="inline-flex items-center gap-2 md:gap-2.5"
        style={{color: 'var(--color-text)'}}
        aria-label={brand.name}
        role="img"
      >
        <CanvasMark size={size === 'lg' ? 34 : 28} />
        <span
          aria-hidden="true"
          className={size === 'lg' ? 'text-2xl' : 'text-lg md:text-xl'}
          style={{
            fontFamily: 'var(--font-display, var(--font-heading))',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          <span style={{fontWeight: 700}}>CANVAS</span>
          <span style={{fontWeight: 300}}>WEARS</span>
        </span>
      </span>
    );
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
