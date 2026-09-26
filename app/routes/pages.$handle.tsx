import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';

// エクラ株式会社の会社情報・特定商取引法表記・お問い合わせ等の静的ページ。
// 事業者情報（会社名・所在地・電話番号等）は法人共通のため、
// Alo Lore（msgreenery）ストアの同内容ページから転記している。
// 配送日数・キャンセル規定はCANVASWEARS（受注生産のPOD）の実態に合わせて記載。
const PAGES: Record<
  string,
  {title: string; description?: string; body: () => JSX.Element}
> = {
  // サービス紹介（About us）。会社情報の表は company、こちらは「何のお店か」を伝える。
  // 数値や規定は配送ページ・FAQ・特商法ページの記載と揃えること。
  about: {
    title: 'CANVASWEARSについて',
    description:
      'CANVASWEARSは、お好きな写真やイラストを服や小物に1点からプリントしてお届けする、昇華プリントのオーダーメイドショップです。',
    body: () => (
      <div className="space-y-12 text-sm leading-loose" style={{color: 'var(--color-text)'}}>
        <p className="text-base leading-loose">
          CANVASWEARS（キャンバスウェアーズ）は、お好きな写真やイラストを、服や小物に
          <strong>1点から</strong>
          プリントしてお届けするオーダーメイドのお店です。服を一枚のキャンバスに見立てて、世界にひとつのアイテムをつくっていただけます。
        </p>

        <AboutBlock heading="昇華プリントでつくっています">
          <p>
            インクを熱で気体にして、生地の繊維そのものに染み込ませる印刷方法です。表面にインクの膜をのせるプリントと違い、プリント部分がごわつかず、洗濯を重ねてもひび割れや色落ちが起きにくいのが特長です。写真もイラストも、全面フルカラーで再現できます。
          </p>
        </AboutBlock>

        <AboutBlock heading="選べるアイテム">
          <p>
            レディース・メンズ・キッズの服から、バッグ、シューズ、水着、ルームウェア、キッチン用品、ペット用品、雑貨まで、1,000点以上のアイテムにプリントできます。在庫の柄を持たないので、1点だけのご注文も、チームやイベントでのまとめてのご注文も承ります。
          </p>
          <p className="mt-3">
            <Link to="/products" className="underline">
              すべての商品を見る
            </Link>
          </p>
        </AboutBlock>

        <AboutBlock heading="ご注文の流れ">
          <ol className="space-y-3">
            {[
              ['アイテムを選ぶ', 'プリントしたい商品とサイズを選びます。'],
              [
                'デザインを入稿する',
                '商品ページからPNG・JPEGの画像（20MBまで）をアップロードします。',
              ],
              [
                'ご要望を伝えて注文する',
                '入れる文字や配置、色味のご希望があれば、ご要望欄にご記入ください。',
              ],
              [
                '製作してお届け',
                'ご注文を受けてから一点ずつ製作します。デザイン確定後、およそ1ヶ月でお届けします。',
              ],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{backgroundColor: 'var(--color-primary)', color: '#fff'}}
                >
                  {i + 1}
                </span>
                <span>
                  <strong className="block">{title}</strong>
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </AboutBlock>

        <AboutBlock heading="ご自身のデザインでお楽しみください">
          <p>
            キャラクターやブランドロゴ、芸能人の写真など、他の方に権利があるデータはお受けできません。ご自身で撮った写真や描いたイラスト、権利者の許可を得たデータでお作りください。
          </p>
        </AboutBlock>

        <AboutBlock heading="運営について">
          <p>
            CANVASWEARSは、東京・白金台のエクラ株式会社が運営しています。ブライズメイドドレスやフラダンス衣装など、特別な日のための衣装を企画・販売してきた経験を活かし、「自分だけの一着」をもっと気軽につくれるお店を目指しています。
          </p>
          <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/pages/company" className="underline">
              会社概要
            </Link>
            <Link to="/pages/contact" className="underline">
              お問い合わせ
            </Link>
          </p>
        </AboutBlock>
      </div>
    ),
  },
  specified: {
    title: '特定商取引法に基づく表記',
    body: () => (
      <dl className="space-y-6 text-sm leading-relaxed">
        {[
          ['販売業者', 'エクラ株式会社'],
          ['代表責任者', '浅原 怜'],
          [
            '所在地',
            <>
              〒108-0071
              <br />
              東京都港区白金台3-18-10 白金台井上ビル5F
            </>,
          ],
          ['電話番号', '050-3562-4455'],
          ['メールアドレス', 'contact@e-clat.jp'],
          ['販売価格', '各商品ページに記載の価格（消費税込）'],
          [
            '商品代金以外の必要料金',
            <>
              消費税（税率10%）、送料（配送先により異なります。ご注文手続きの画面でご確認いただけます）
            </>,
          ],
          [
            '支払方法',
            'クレジットカード決済、銀行振込（三菱UFJ銀行 目黒支店 普通 0407316 エクラ(カ）',
          ],
          ['支払時期', 'ご注文時（クレジットカード）／ご注文後3日以内（銀行振込）'],
          [
            '商品の引渡時期',
            '受注生産のため、デザイン確定後 約1ヶ月でお届けします（商品により5〜7営業日でお届けの場合もあります。海外製作のため、混雑時はさらにお時間をいただく場合があります）',
          ],
          ['商品の引渡方法', '宅配業者による配送のみ'],
          [
            'キャンセル・返品について',
            'すべての商品はご注文後に製作を開始する受注生産品のため、お客様のご都合によるキャンセル・返品・交換はお受けできません。不良品・誤配送の場合は、商品到着後3日以内にメールにてご連絡ください。',
          ],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-xs tracking-widest uppercase mb-1" style={{color: 'var(--color-primary)'}}>
              {label}
            </dt>
            <dd style={{color: 'var(--color-text)'}}>{value}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  company: {
    title: '会社概要',
    body: () => (
      <dl className="space-y-6 text-sm leading-relaxed">
        {[
          ['会社名', 'エクラ株式会社'],
          ['設立', '2014年10月30日'],
          ['代表取締役社長', '浅原 怜'],
          [
            '本社所在地',
            <>
              〒108-0071
              <br />
              東京都港区白金台3-18-10 白金台井上ビル5F
            </>,
          ],
          ['電話番号', '050-3562-4455'],
          [
            '事業内容',
            'ブライズメイドドレス・フラダンス衣装・パーティードレスの企画販売、および昇華プリントによるカスタムプリント商品（CANVASWEARS）の企画販売',
          ],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-xs tracking-widest uppercase mb-1" style={{color: 'var(--color-primary)'}}>
              {label}
            </dt>
            <dd style={{color: 'var(--color-text)'}}>{value}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  contact: {
    title: 'お問い合わせ',
    body: () => (
      <div className="space-y-8 text-sm leading-relaxed" style={{color: 'var(--color-text)'}}>
        <p>ご注文内容やデザイン入稿に関するご質問など、お気軽にお問い合わせください。</p>
        <div className="space-y-4">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{color: 'var(--color-primary)'}}>
              メール
            </p>
            <a href="mailto:contact@e-clat.jp" className="underline">
              contact@e-clat.jp
            </a>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{color: 'var(--color-primary)'}}>
              電話
            </p>
            <a href="tel:050-3562-4455" className="underline">
              050-3562-4455
            </a>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{color: 'var(--color-primary)'}}>
              LINE
            </p>
            <img
              src="https://qr-official.line.me/gs/M_073kjywk_GW.png?oat_content=qr"
              alt="CANVASWEARS公式LINEのQRコード"
              className="w-32 h-32"
              style={{border: '1px solid var(--color-border)', borderRadius: 'var(--radius)'}}
            />
            {/* スマホで見ている人は自分の画面のQRを読み取れないので、
                タップで友だち追加できるリンクも並べる。 */}
            <a
              href="https://page.line.me/073kjywk"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 px-5 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: '#06C755',
                color: '#fff',
                borderRadius: 'var(--radius)',
              }}
            >
              LINEで友だち追加
            </a>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{color: 'var(--color-primary)'}}>
              Instagram
            </p>
            <a
              href="https://www.instagram.com/canvas_wears_tokyo"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              @canvas_wears_tokyo
            </a>
          </div>
        </div>
      </div>
    ),
  },
  shipping: {
    title: '配送・返品について',
    body: () => (
      <div className="space-y-8 text-sm leading-relaxed" style={{color: 'var(--color-text)'}}>
        <div>
          <h2 className="text-base font-bold mb-2" style={{color: 'var(--color-text)'}}>
            お届けまでの期間
          </h2>
          <p>
            すべての商品はご注文後にデザインを印刷して製作する受注生産品です。デザイン確定後、約1ヶ月でお届けします（商品により5〜7営業日でお届けの場合もあります）。海外製作のため、混雑時はさらにお時間をいただく場合があります。
          </p>
        </div>
        <div>
          <h2 className="text-base font-bold mb-2" style={{color: 'var(--color-text)'}}>
            送料
          </h2>
          <p>
            送料は配送先地域により異なります。正確な金額はカート・ご注文手続きの画面でご確認いただけます。まとめてご注文いただくと数量割引（5点以上で10%OFFなど）もご利用いただけます。
          </p>
        </div>
        <div>
          <h2 className="text-base font-bold mb-2" style={{color: 'var(--color-text)'}}>
            キャンセル・返品・交換
          </h2>
          <p>
            受注生産のため、お客様のご都合によるキャンセル・返品・交換はお受けできません。デザインやサイズをよくご確認のうえご注文ください。
            <br />
            不良品・誤配送の場合は、商品到着後3日以内にメールにてご連絡ください。確認のうえ、返品・交換の対応をいたします。
          </p>
        </div>
      </div>
    ),
  },
};

export const meta = ({data}: any) => {
  const page = data?.handle ? PAGES[data.handle] : undefined;
  return getSeoMeta({title: page?.title ?? 'ページ', description: page?.description});
};

export async function loader({params}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle || !PAGES[handle]) throw new Response('Not found', {status: 404});
  return {handle};
}

export default function StaticPage() {
  const {handle} = useLoaderData<typeof loader>();
  const page = PAGES[handle];

  return (
    <div className="section-pad">
      <div className="container-brand max-w-2xl mx-auto">
        <h1
          className="text-display-md mb-10"
          style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
        >
          {page.title}
        </h1>
        {page.body()}
      </div>
    </div>
  );
}

/** 「CANVASWEARSについて」の見出しつき段落 */
function AboutBlock({heading, children}: {heading: string; children: React.ReactNode}) {
  return (
    <section>
      <h2
        className="mb-3"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1.125rem',
          color: 'var(--color-text)',
        }}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}
