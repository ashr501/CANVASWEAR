/**
 * SNSアカウントのアイコンリンク（フッター・お問い合わせページで共用）。
 * アカウントを増やすときは SOCIAL_LINKS に1行足す（X を追加する場合は icon: 'x'）。
 */
export const SOCIAL_LINKS: Array<{name: string; href: string; icon: 'instagram' | 'x'}> = [
  {name: 'Instagram', href: 'https://www.instagram.com/canvas_wears_tokyo', icon: 'instagram'},
  {name: 'X', href: 'https://x.com/canvas_wears', icon: 'x'},
];

function Icon({icon}: {icon: 'instagram' | 'x'}) {
  if (icon === 'x') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SocialIcons({size = 40}: {size?: number}) {
  return (
    <ul className="flex items-center gap-3">
      {SOCIAL_LINKS.map(({name, href, icon}) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name}（新しいタブで開きます）`}
            title={name}
            className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{
              width: size,
              height: size,
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <Icon icon={icon} />
          </a>
        </li>
      ))}
    </ul>
  );
}
