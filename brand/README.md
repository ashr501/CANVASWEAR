# CANVASWEARS ブランド素材

サイト（`custom-print`）のロゴ・コピー・色・書体の元データ。サイトを直すときはここに合わせる。

| ファイル | 中身 |
|---|---|
| `canvaswears-brand.pen` | Pencilファイル。ロゴ（横組み・縦組み・ステッカー版）、キャッチコピー6案、色と書体 |
| `brand-board.png` | 上のPencilファイルと同じ内容の見本画像 |
| `logo.svg` / `logo-on-dark.svg` | 横組みロゴ（明るい背景用 / 暗い背景用） |
| `symbol.svg` / `symbol-sticker.svg` | シンボルだけ（通常版 / ほっぺ付きのステッカー版） |
| `logo-extra.json` | ブランド資料にだけ使う形（ステッカー版・カナ） |
| `build-pen.mjs` | PencilファイルとSVGを作り直すスクリプト（`node brand/build-pen.mjs`） |

## ロゴ「生地くん」

ピンキングばさみで切った生地の切れ端（朱）に、生成り色のにっこり顔。
文字は丸みのある Fredoka 600 の小文字を輪郭（パス）にしたもので、`canvas` は墨、`wears` は朱。
書体を読み込まなくても同じ形で出るよう、サイトでもSVGのパスで描いている。

- 形のデータは `app/lib/logo-data.json` の1か所。サイト（`app/components/BrandLogo.tsx`）、
  Pencilファイル、書き出しSVGはすべてここから作る
- 暗い背景では `canvas` を生成り（`#FBF7F2`）にする。生地と `wears` は朱のまま
- ほっぺ付きのステッカー版は、SNSのアイコンやステッカーなど大きく使うときだけ（32pxより小さくしない）
- 生地を回したり、顔の向きや表情を変えたりしない

## コピー

- メイン: **着るものぜんぶ、キャンバス。**（英: Wear Your Canvas）
- 説明・検索向け: 昇華プリントで、どんな柄も1点から。（ページタイトルとフッターはこちらのまま）
- 納期・データ形式など事実を書くときは `app/components/FaqSection.tsx` と同じ内容にする

## 色

| 名前 | 値 | 使いどころ |
|---|---|---|
| 朱 | `#D43D24` | ボタン・強調・ロゴ。白文字を載せられる濃さ（4.6:1） |
| 墨 | `#1F1B18` | 文字・ロゴ |
| 生成り | `#FBF7F2` | ページの地色 |
| 砂 | `#F6EADF` | 帯・アイコンの地 |
| 罫線 | `#EADFD3` | 枠線・区切り |

値は `app/lib/brands.ts` と `app/styles/app.css` の `custom-print` の2か所にある。変えるときは両方直す。
朱色は強調にだけ使う。商品の価格は墨色（一覧が赤いとセール中に見えるため）。

## 書体

- 見出し: Zen Kaku Gothic New 700 / 900
- 本文: Noto Sans JP 400 / 500
- 欧文の小見出し・数字・ロゴ: Outfit 300 / 500 / 700（CSS変数 `--font-display`）
