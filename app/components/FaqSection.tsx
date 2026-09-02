export const CANVASWEAR_FAQ = [
  {
    q: 'どんなデータを送ればいいですか？',
    a: 'PNG・JPEGに対応しています（20MBまで）。商品ページのアップロード欄からそのまま送信できます。',
  },
  {
    q: '何点から注文できますか？',
    a: '1点から製作できます。柄の在庫を持たないので、思い立ったときにオーダーいただけます。',
  },
  {
    q: '洗濯すると色落ちしませんか？',
    a: '昇華プリントは染料が生地の繊維そのものに定着するため、洗濯を重ねてもひび割れや色落ちが起きにくい仕上がりです。',
  },
  {
    q: '写真でもイラストでも大丈夫ですか？',
    a: 'はい、写真もイラストも全面フルカラーで再現できます。ご希望の配置や色味はご要望欄からお伝えください。',
  },
];

/** design.mdの FAQ Accordion。ネイティブ <details>/<summary> でキーボード操作にも対応。
 *  ホーム・商品ページ共通で使う（商品ページでは compact で見出しを小さくする）。 */
export default function FaqSection({compact = false}: {compact?: boolean}) {
  return (
    <section
      className="section-pad"
      style={{backgroundColor: compact ? 'transparent' : 'var(--color-surface)'}}
    >
      <div className="container-brand max-w-3xl mx-auto">
        <p
          className="text-xs tracking-widest uppercase mb-2 text-center"
          style={{color: 'var(--color-primary)'}}
        >
          FAQ
        </p>
        <h2
          className="text-center mb-10"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: compact ? 'clamp(1.25rem, 2.5vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-text)',
          }}
        >
          よくあるご質問
        </h2>
        <div className="space-y-3">
          {CANVASWEAR_FAQ.map(({q, a}) => (
            <details
              key={q}
              className="group"
              style={{
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <summary
                className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-4 text-sm md:text-base"
                style={{color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontWeight: 500}}
              >
                {q}
                <span
                  className="shrink-0 transition-transform duration-300 group-open:rotate-180"
                  style={{color: 'var(--color-primary)'}}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </summary>
              <p
                className="px-6 pb-5 text-sm leading-loose"
                style={{color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)'}}
              >
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
