import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';

// エクラ株式会社の会社情報・特定商取引法表記・お問い合わせ等の静的ページ。
// 事業者情報（会社名・所在地・電話番号等）は法人共通のため、
// Alo Lore（msgreenery）ストアの同内容ページから転記している。
// 配送日数・キャンセル規定はCANVASWEARS（受注生産のPOD）の実態に合わせて記載。
const PAGES: Record<
  string,
  {title: string; body: () => JSX.Element}
> = {
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
  return getSeoMeta({title: page?.title ?? 'ページ'});
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
