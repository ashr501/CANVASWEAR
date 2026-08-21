import {Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Await} from '@remix-run/react';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

interface HeaderProps {
  brand: PublicBrand;
  cart: any;
  onCartOpen: () => void;
}

export default function Header({brand, cart, onCartOpen}: HeaderProps) {
  const isAvantGarde = isBoldBrand(brand.id);

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
      style={{height: 'var(--header-height)'}}
    >
      <div
        className="container-brand h-full flex items-center justify-between relative"
        style={{height: 'var(--header-height)'}}
      >
        {/* ナビ左 */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(({to, label}) => (
            <Link
              key={to}
              to={to}
              className="text-xs tracking-widest uppercase transition-colors hover:opacity-70"
              style={{
                color: 'var(--color-text-muted)',
                fontFamily: isAvantGarde ? 'var(--font-body)' : 'var(--font-heading)',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ロゴ中央 */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <span
            className={clsx(
              'tracking-[0.3em] uppercase',
              isAvantGarde ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl',
            )}
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-text)',
              fontWeight: isAvantGarde ? 400 : 400,
              letterSpacing: isAvantGarde ? '0.4em' : '0.25em',
            }}
          >
            {brand.name}
          </span>
        </Link>

        {/* カートアイコン右 */}
        <div className="flex items-center gap-4">
          <Suspense
            fallback={<CartIcon count={0} onClick={onCartOpen} isAvantGarde={isAvantGarde} />}
          >
            <Await resolve={cart}>
              {(resolvedCart: any) => (
                <CartIcon
                  count={resolvedCart?.totalQuantity ?? 0}
                  onClick={onCartOpen}
                  isAvantGarde={isAvantGarde}
                />
              )}
            </Await>
          </Suspense>
        </div>
      </div>

      {/* モバイルナビ */}
      <nav
        className="md:hidden flex items-center gap-6 px-4 pb-2 overflow-x-auto"
        style={{marginTop: '-4px'}}
      >
        {links.map(({to, label}) => (
          <Link
            key={to}
            to={to}
            className="text-xs tracking-widest uppercase whitespace-nowrap"
            style={{color: 'var(--color-text-muted)'}}
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
