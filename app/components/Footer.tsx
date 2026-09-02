import {Link} from '@remix-run/react';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

interface FooterProps {
  brand: PublicBrand;
}

export default function Footer({brand}: FooterProps) {
  const isAvantGarde = isBoldBrand(brand.id);

  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: isAvantGarde ? 'var(--color-bg)' : 'var(--color-surface)',
      }}
    >
      <div className="container-brand section-pad">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* ブランド */}
          <div>
            <p
              className={clsx(
                'mb-4',
                isAvantGarde ? 'text-3xl tracking-[0.3em]' : 'text-2xl tracking-[0.2em]',
                'uppercase',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text)',
              }}
            >
              {brand.name}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{color: 'var(--color-text-muted)'}}
            >
              {brand.taglineJa}
            </p>
          </div>

          {/* ショップ */}
          <div>
            <h3
              className="text-xs tracking-widest uppercase mb-6"
              style={{color: 'var(--color-text-muted)'}}
            >
              SHOP
            </h3>
            <ul className="space-y-3">
              {[
                ...brand.nav.map((item) => ({
                  label: item.label,
                  href: `/collections/${item.handle}`,
                })),
                {label: brand.copy.navAllItems, href: '/products'},
                {label: '動画でみる', href: '/videos'},
              ].map(({label, href}) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm transition-colors"
                    style={{color: 'var(--color-text-muted)'}}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3
              className="text-xs tracking-widest uppercase mb-6"
              style={{color: 'var(--color-text-muted)'}}
            >
              SUPPORT
            </h3>
            <ul className="space-y-3">
              {[
                {label: '配送・返品', href: '/pages/shipping'},
                {label: 'お問い合わせ', href: '/pages/contact'},
                {label: '会社概要', href: '/pages/company'},
                {label: '特定商取引法に基づく表記', href: '/pages/specified'},
              ].map(({label, href}) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm transition-colors"
                    style={{color: 'var(--color-text-muted)'}}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* フォロー */}
          <div>
            <h3
              className="text-xs tracking-widest uppercase mb-6"
              style={{color: 'var(--color-text-muted)'}}
            >
              FOLLOW
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.instagram.com/canvas_wears_tokyo"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm transition-colors"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  Instagram
                </a>
              </li>
              <li>
                <Link
                  to="/pages/contact"
                  className="text-sm transition-colors"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  LINEで相談する
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{borderTop: '1px solid var(--color-border)'}}
        >
          <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/policies/privacy-policy"
              className="text-xs transition-colors"
              style={{color: 'var(--color-text-muted)'}}
            >
              プライバシーポリシー
            </Link>
            <Link
              to="/policies/terms-of-service"
              className="text-xs transition-colors"
              style={{color: 'var(--color-text-muted)'}}
            >
              利用規約
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
