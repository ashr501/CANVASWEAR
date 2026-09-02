import {Link} from '@remix-run/react';
import clsx from 'clsx';
import type {BrandNavItem} from '~/lib/brands';

/** 商品一覧・コレクションページ共通のカテゴリ絞り込みチップ。
 *  activeHandleを渡さない場合は「全商品」ページとして扱い、先頭に「すべて」を出す。 */
export default function CategoryFilterChips({
  nav,
  activeHandle,
}: {
  nav: BrandNavItem[];
  activeHandle?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-10">
      <Link
        to="/products"
        prefetch="intent"
        className="px-4 py-2 text-xs tracking-wider uppercase transition-all duration-150"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: !activeHandle ? 'var(--color-text)' : 'transparent',
          color: !activeHandle ? 'var(--color-bg)' : 'var(--color-text)',
          border: '1px solid var(--color-border)',
        }}
      >
        すべて
      </Link>
      {nav.map(({label, handle}) => {
        const isActive = handle === activeHandle;
        return (
          <Link
            key={handle}
            to={`/collections/${handle}`}
            prefetch="intent"
            className={clsx(
              'px-4 py-2 text-xs tracking-wider uppercase transition-all duration-150',
            )}
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: isActive ? 'var(--color-text)' : 'transparent',
              color: isActive ? 'var(--color-bg)' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
