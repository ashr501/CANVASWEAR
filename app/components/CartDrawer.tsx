import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {Await} from '@remix-run/react';
import {Suspense} from 'react';
import clsx from 'clsx';
import {isBoldBrand} from '~/lib/brands';

interface CartDrawerProps {
  cart: any;
  isOpen: boolean;
  onClose: () => void;
  brand: {id: string; name: string};
}

export default function CartDrawer({cart, isOpen, onClose, brand}: CartDrawerProps) {
  const isAvantGarde = isBoldBrand(brand.id);

  return (
    <>
      {/* オーバーレイ */}
      <div
        className={clsx('cart-overlay', isOpen && 'open')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ドロワー */}
      <aside
        className={clsx('cart-drawer', isOpen && 'open')}
        aria-label="カート"
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{borderBottom: '1px solid var(--color-border)'}}
          >
            <h2
              className={clsx(
                isAvantGarde
                  ? 'text-xl tracking-[0.3em] uppercase'
                  : 'text-lg tracking-[0.1em]',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text)',
              }}
            >
              {isAvantGarde ? 'CART' : 'カート'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 transition-opacity hover:opacity-60"
              style={{color: 'var(--color-text-muted)'}}
              aria-label="閉じる"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* カート内容 */}
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<CartLoading />}>
              <Await resolve={cart}>
                {(resolvedCart: any) => {
                  if (!resolvedCart || resolvedCart.totalQuantity === 0) {
                    return <CartEmpty isAvantGarde={isAvantGarde} onClose={onClose} />;
                  }
                  return <CartLines lines={resolvedCart.lines} isAvantGarde={isAvantGarde} />;
                }}
              </Await>
            </Suspense>
          </div>

          {/* フッター */}
          <Suspense fallback={null}>
            <Await resolve={cart}>
              {(resolvedCart: any) => {
                if (!resolvedCart || resolvedCart.totalQuantity === 0) return null;
                return (
                  <div
                    className="px-6 py-6 space-y-4"
                    style={{borderTop: '1px solid var(--color-border)'}}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm tracking-wider" style={{color: 'var(--color-text-muted)'}}>
                        小計
                      </span>
                      <span className="font-medium" style={{color: 'var(--color-text)'}}>
                        <Money as="span" data={resolvedCart.cost.subtotalAmount} />
                      </span>
                    </div>
                    <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                      送料・税金はチェックアウト時に計算されます
                    </p>
                    <a
                      href={resolvedCart.checkoutUrl}
                      className="btn-primary w-full text-center block"
                    >
                      {isAvantGarde ? 'CHECKOUT' : 'チェックアウトへ'}
                    </a>
                    <Link
                      to="/cart"
                      onClick={onClose}
                      className="btn-outline w-full text-center block text-xs"
                    >
                      {isAvantGarde ? 'VIEW CART' : 'カートを見る'}
                    </Link>
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </aside>
    </>
  );
}

function CartLines({lines, isAvantGarde}: {lines: any; isAvantGarde: boolean}) {
  return (
    <ul style={{borderBottom: '1px solid var(--color-border)'}}>
      {lines.edges.map(({node: line}: any) => (
        <li
          key={line.id}
          className="flex gap-4 px-6 py-5"
          style={{borderBottom: '1px solid var(--color-border)'}}
        >
          {line.merchandise.image && (
            <div
              className="w-20 h-24 flex-shrink-0 overflow-hidden"
              style={{borderRadius: 'var(--radius)'}}
            >
              <Image
                data={line.merchandise.image}
                className={clsx(
                  'w-full h-full object-cover',
                  isAvantGarde && 'grayscale',
                )}
                sizes="80px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{color: 'var(--color-text)'}}>
              {line.merchandise.product.title}
            </p>
            <p className="text-xs mt-0.5" style={{color: 'var(--color-text-muted)'}}>
              {line.merchandise.selectedOptions
                .filter((o: any) => o.value !== 'Default Title')
                .map((o: any) => o.value)
                .join(' / ')}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                ×{line.quantity}
              </p>
              <Money
                data={line.cost.totalAmount}
                className="text-sm"
                style={{color: 'var(--color-text)'} as any}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CartEmpty({isAvantGarde, onClose}: {isAvantGarde: boolean; onClose: () => void}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        style={{color: 'var(--color-border)'}}
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      <div>
        <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>
          カートは空です
        </p>
        {isAvantGarde && (
          <p className="text-xs mt-1 tracking-wider" style={{color: 'var(--color-text-muted)'}}>
            YOUR CART IS EMPTY
          </p>
        )}
      </div>
      <button onClick={onClose} className="btn-outline text-xs">
        {isAvantGarde ? 'CONTINUE SHOPPING' : 'ショッピングを続ける'}
      </button>
    </div>
  );
}

function CartLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div
        className="w-6 h-6 rounded-full animate-spin"
        style={{
          border: '1px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
    </div>
  );
}
