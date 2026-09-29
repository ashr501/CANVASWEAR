"""CANVASWEARSのFAQ（app/components/FaqSection.tsx）から、Alo Loreテーマ用のFAQセクションを作る。

両サイトでFAQの内容をそろえるため、FAQの原本はFaqSection.tsxの1か所だけにする。
FAQを直したら、このスクリプトで sections/custom-print-faq.liquid を作り直してテーマに上げる。

Alo Loreの商品ページには入稿欄がない（ご注文後にデータを連絡する流れ）ため、
入稿方法の答えだけAlo Lore用に差し替える。
"""
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
src = (ROOT / "app/components/FaqSection.tsx").read_text(encoding="utf-8")

block = src[src.index("export const CANVASWEAR_FAQ"):src.index("];")]
faq = re.findall(r"q: '([^']+)',\s*a: '([^']+)',", block)
if len(faq) < 10:
    sys.exit(f"FAQの読み取りに失敗しました（{len(faq)}件）")

ALO_LORE_ANSWERS = {
    "どんなデータを送ればいいですか？":
        "PNG・JPEGに対応しています（20MBまで）。デザインデータはご注文後にご連絡ください。"
        "入れたい文字や配置のご希望は、商品ページの「ご要望・コメント」欄にお書きください。",
}
faq = [(q, ALO_LORE_ANSWERS.get(q, a).replace("ご要望欄", "「ご要望・コメント」欄")) for q, a in faq]

items = "\n".join(
    f"""      <details class="alo-cp-faq__item">
        <summary><span>{html.escape(q)}</span><span class="alo-cp-faq__icon" aria-hidden="true">＋</span></summary>
        <p>{html.escape(a)}</p>
      </details>"""
    for q, a in faq
)

liquid = f"""{{% comment %}}
  カスタムプリント商品のFAQ。商品名に「カスタムプリント」を含む商品のページにだけ表示する
  （product.json は他の商品と共用のため、この条件で出し分ける）。
  このファイルは CANVASWEAR リポジトリの scripts/build_alolore_faq.py で生成している。
  直接編集せず、FaqSection.tsx を直してから作り直すこと。
{{% endcomment %}}
{{%- if product.title contains 'カスタムプリント' -%}}
<section class="alo-cp-faq page-width">
  <p class="alo-cp-faq__eyebrow">FAQ</p>
  <h2 class="alo-cp-faq__heading">カスタムプリントについてよくあるご質問</h2>

  <div class="alo-cp-faq__notice">
    <p class="alo-cp-faq__notice-title">著作権のあるデータはご利用いただけません</p>
    <p>アニメ・漫画のキャラクター、ブランドのロゴ、芸能人やアーティストの写真など、他の方に権利があるデータはお受けできません。ご自身で撮影した写真、ご自身で描いたイラスト、権利者から許可を得ているデータをご入稿ください。権利を侵害するデータと判明した場合は製作を中止いたします。受注生産のため、その際のご返金はいたしかねます。</p>
  </div>

  <div class="alo-cp-faq__list">
{items}
  </div>
</section>

<style>
  .alo-cp-faq {{ max-width: 76rem; margin: 4rem auto; }}
  .alo-cp-faq__eyebrow {{ text-align: center; letter-spacing: .2em; font-size: 1.2rem; color: rgb(var(--color-link, 192 57 43)); margin: 0 0 .4rem; }}
  .alo-cp-faq__heading {{ text-align: center; font-size: 2rem; margin: 0 0 2.4rem; }}
  .alo-cp-faq__notice {{ border: 1.5px solid #c0392b; border-radius: 12px; padding: 1.6rem 2rem; margin-bottom: 2rem; font-size: 1.4rem; line-height: 1.9; }}
  .alo-cp-faq__notice p {{ margin: 0; }}
  .alo-cp-faq__notice-title {{ color: #c0392b; font-weight: 700; margin-bottom: .6rem !important; }}
  .alo-cp-faq__item {{ border: 1px solid rgba(var(--color-foreground), .15); border-radius: 12px; margin-bottom: 1rem; }}
  .alo-cp-faq__item summary {{ display: flex; justify-content: space-between; gap: 1.6rem; align-items: center; cursor: pointer; list-style: none; padding: 1.4rem 2rem; font-size: 1.5rem; font-weight: 500; }}
  .alo-cp-faq__item summary::-webkit-details-marker {{ display: none; }}
  .alo-cp-faq__item[open] .alo-cp-faq__icon {{ transform: rotate(45deg); }}
  .alo-cp-faq__icon {{ flex-shrink: 0; transition: transform .2s; color: #c0392b; }}
  .alo-cp-faq__item p {{ margin: 0; padding: 0 2rem 1.6rem; font-size: 1.4rem; line-height: 1.9; opacity: .8; }}
</style>
{{%- endif -%}}

{{% schema %}}
{{
  "name": "カスタムプリントFAQ",
  "settings": []
}}
{{% endschema %}}
"""

out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "custom-print-faq.liquid")
out.write_text(liquid, encoding="utf-8")
print(f"{len(faq)}問のFAQを {out} に書き出しました")
