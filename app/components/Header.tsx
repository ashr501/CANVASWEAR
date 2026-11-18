import {Link} from 'react-router';
import {useCart} from '~/lib/cart';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';
import SearchBar from './SearchBar';
import BrandLogo from './BrandLogo';

interface HeaderProps {
  brand: PublicBrand;
  onCartOpen: () => void;
}

export default function Header({brand, onCartOpen}: HeaderProps) {
  const isAvantGarde = isBoldBrand(brand.id);
  const isClean = brand.uiMode === 'clean';
  const cartCount = useCart((state) => state.data.totalQuantity);

  // ブランド固有のカテゴリ + 全商品。ブランドを追加すればナビも自動で入れ替わる
  const links = [
    ...brand.nav.map((item) => ({
      to: `/collections/${item.handle}`,
      label: item.label,
    })),
    {to: '/products', label: brand.copy.navAllItems},
  ];

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-30 transition-all duration-300',
        isAvantGarde
          ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm'
          : 'bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-[var(--color-border)]',
      )}
    >
      {/* ヘッダー全体の高さはロゴ行+ナビ行の合計。<header>に固定高を付けると
          下線がロゴ行の位置に引かれ、ナビ行が別のバーのように見えてしまう。 */}
      <div
        className="container-brand flex items-center justify-between relative"
        style={{height: 'var(--header-height)'}}
      >
        {/* 検索 */}
        <SearchBar />

        {/* ロゴ中央 */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <BrandLogo brand={brand} />
        </Link>

        {/* カートアイコン右 */}
        <div className="flex items-center gap-4">
          <CartIcon count={cartCount ?? 0} onClick={onCartOpen} isAvantGarde={isAvantGarde} />
        </div>
      </div>

      {/* ナビ（カテゴリが多いためロゴと同じ行には置かず、常に専用の行で横スクロール表示する） */}
      <nav
        className="container-brand flex items-center gap-6 overflow-x-auto no-scrollbar"
        style={{height: 'var(--nav-height)'}}
      >
        {links.map(({to, label}) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              'whitespace-nowrap transition-colors',
              isClean
                ? 'text-[13px] font-medium tracking-wide hover:text-[var(--color-primary)]'
                : 'text-xs tracking-widest uppercase hover:opacity-70',
            )}
            style={{
              color: isClean ? undefined : 'var(--color-text-muted)',
              fontFamily:
                isAvantGarde || isClean ? 'var(--font-body)' : 'var(--font-heading)',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function CartIcon({
  count,
  onClick,
  isAvantGarde,
}: {
  count: number;
  onClick: () => void;
  isAvantGarde: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center transition-opacity hover:opacity-70"
      style={{color: 'var(--color-text)'}}
      aria-label={`カート (${count}点)`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isAvantGarde ? 1.5 : 1}
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-[10px] font-medium w-4 h-4"
          style={{
            backgroundColor: isAvantGarde
              ? 'var(--color-accent)'
              : 'var(--color-primary)',
            color: 'var(--color-bg)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
