import type {InstagramPost} from '~/lib/instagram.server';
import {SOCIAL_LINKS} from './SocialIcons';

const PROFILE = SOCIAL_LINKS.find((l) => l.icon === 'instagram')!;
const HANDLE = '@' + PROFILE.href.replace(/\/+$/, '').split('/').pop();

function InstagramGlyph({size = 20}: {size?: number}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FollowButton() {
  return (
    <a
      href={PROFILE.href}
      target="_blank"
      rel="noreferrer"
      className="btn-primary"
    >
      {/* btn-primary は inline-block なので、アイコンと文字の横並びは内側で作る */}
      <span className="inline-flex items-center gap-2">
        <InstagramGlyph size={18} />
        Instagramをフォロー
      </span>
    </a>
  );
}

/**
 * トップページのInstagram欄。最近の投稿を6枚並べ、各投稿へリンクする。
 * 投稿が取れないとき（トークン未設定など）は、フォローの案内だけを小さく出す。
 */
export default function InstagramSection({posts}: {posts: InstagramPost[]}) {
  if (!posts.length) {
    return (
      <section className="py-10 container-brand" style={{backgroundColor: 'var(--color-bg)'}}>
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 py-7 px-6 md:px-10"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div className="flex items-center gap-4">
            <span
              className="flex items-center justify-center w-12 h-12 rounded-full shrink-0"
              style={{backgroundColor: 'var(--color-hero-bg)', color: 'var(--color-primary)'}}
            >
              <InstagramGlyph size={24} />
            </span>
            <div>
              <p
                className="text-base"
                style={{fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text)'}}
              >
                作ったものをInstagramで紹介しています
              </p>
              <p className="text-xs mt-1" style={{color: 'var(--color-text-muted)'}}>
                {HANDLE}
              </p>
            </div>
          </div>
          <FollowButton />
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad" style={{backgroundColor: 'var(--color-bg)'}}>
      <div className="container-brand">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
          <div>
            <p
              className="text-xs mb-2.5"
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-display, var(--font-heading))',
                fontWeight: 500,
                letterSpacing: '0.2em',
              }}
            >
              INSTAGRAM
            </p>
            <h2
              className="text-display-md"
              style={{fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text)'}}
            >
              最近つくったもの
            </h2>
            <a
              href={PROFILE.href}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-sm transition-colors hover:text-[var(--color-primary)]"
              style={{color: 'var(--color-text-muted)'}}
            >
              {HANDLE}
            </a>
          </div>
          <div className="hidden md:block">
            <FollowButton />
          </div>
        </div>

        <ul className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square overflow-hidden"
                style={{borderRadius: '14px', backgroundColor: 'var(--color-border)'}}
                aria-label={post.caption ? `Instagramの投稿：${post.caption}` : 'Instagramの投稿'}
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  loading="lazy"
                  decoding="async"
                  // Instagramの画像は参照元を送ると表示されないことがあるため送らない
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {post.isVideo && (
                  <span
                    className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full"
                    style={{backgroundColor: 'rgba(31,27,24,0.6)', color: '#FFFFFF'}}
                    aria-hidden="true"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <path d="M2 1L9 5L2 9Z" fill="currentColor" />
                    </svg>
                  </span>
                )}
                <span
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{backgroundColor: 'rgba(212,61,36,0.55)', color: '#FFFFFF'}}
                  aria-hidden="true"
                >
                  <InstagramGlyph size={28} />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center md:hidden">
          <FollowButton />
        </div>
      </div>
    </section>
  );
}
