export const CANVASWEAR_FAQ = [
  // 入稿・データ
  {
    q: 'どんなデータを送ればいいですか？',
    a: 'PNG・JPEGに対応しています（20MBまで）。商品ページのアップロード欄からそのまま送信できます。',
  },
  {
    q: '画質はどのくらい必要ですか？',
    a: 'プリントする面の実寸に対して、解像度150dpi以上を目安にしてください。スマートフォンで撮影した写真であれば、多くの場合そのままご利用いただけます。引き伸ばすと粗さが目立つデータの場合は、お受けする前にご連絡します。',
  },
  {
    q: '写真でもイラストでも大丈夫ですか？',
    a: 'はい、写真もイラストも全面フルカラーで再現できます。ご希望の配置や色味はご要望欄からお伝えください。',
  },
  {
    q: '画面で見た色と仕上がりの色は同じですか？',
    a: 'モニターは光で、プリントは染料で色を表現するため、まったく同じにはなりません。とくに蛍光色や濃い青・紫は、わずかに沈んで見えることがあります。色味を厳密に合わせたい場合は、ご注文前にご相談ください。',
  },
  // 注文・数量
  {
    q: '何点から注文できますか？',
    a: '1点から製作できます。柄の在庫を持たないので、思い立ったときにオーダーいただけます。',
  },
  {
    q: 'チームウェアやノベルティなど、まとめて作れますか？',
    a: 'はい、承っています。5点以上で10%OFFなどの数量割引をご利用いただけます。同じデザインで複数サイズを組み合わせることもできますので、枚数と用途をお知らせください。お見積りをお出しします。',
  },
  // 納期・費用
  {
    q: 'どのくらいで届きますか？',
    a: 'すべて受注生産のため、デザイン確定後およそ1ヶ月でのお届けです（商品によっては5〜7営業日で仕上がるものもあります）。海外で製作しているため、混雑期はさらにお時間をいただく場合があります。お急ぎの場合は事前にご相談ください。',
  },
  {
    q: '送料はいくらですか？',
    a: '配送先の地域によって異なります。正確な金額はカート・ご注文手続きの画面でご確認いただけます。',
  },
  {
    q: '支払い方法は何が使えますか？',
    a: 'クレジットカード決済と銀行振込をご利用いただけます。銀行振込の場合はご注文後3日以内にお振り込みください。',
  },
  // 品質
  {
    q: '洗濯すると色落ちしませんか？',
    a: '昇華プリントは染料が生地の繊維そのものに定着するため、洗濯を重ねてもひび割れや色落ちが起きにくい仕上がりです。',
  },
  // 返品
  {
    q: '注文後のキャンセルや返品はできますか？',
    a: 'お一人ひとりのデザインで製作する受注生産品のため、お客様のご都合によるキャンセル・返品・交換はお受けできません。デザインとサイズをよくご確認のうえご注文ください。なお、不良品や誤配送の場合は、商品到着後3日以内にご連絡いただければ返品・交換の対応をいたします。',
  },
];

/** 著作権の注意。トラブルになると製作も返金もできなくなるため、
 *  アコーディオンに畳まず常に開いた状態で見せる。 */
function CopyrightNotice() {
  return (
    <div
      className="mb-6 px-6 py-5"
      style={{
        borderRadius: '16px',
        border: '1.5px solid var(--color-primary)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <p
        className="text-sm md:text-base mb-2"
        style={{color: 'var(--color-primary)', fontWeight: 700}}
      >
        著作権のあるデータはご利用いただけません
      </p>
      <p
        className="text-sm leading-loose"
        style={{color: 'var(--color-text)', fontFamily: 'var(--font-body)'}}
      >
        アニメ・漫画のキャラクター、ブランドのロゴ、芸能人やアーティストの写真など、
        他の方に権利があるデータはお受けできません。ご自身で撮影した写真、ご自身で描いたイラスト、
        権利者から許可を得ているデータをご入稿ください。
        <br />
        権利を侵害するデータと判明した場合、製作を中止いたします。
        受注生産のため、その際のご返金はいたしかねますのでご了承ください。
        判断に迷う場合は、ご注文前にお気軽にご相談ください。
      </p>
    </div>
  );
}

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
        <CopyrightNotice />

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
