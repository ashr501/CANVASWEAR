# CANVASWEARS ブランド素材

サイト（`custom-print`）のロゴ・コピー・色・書体の元データ。サイトを直すときはここに合わせる。

| ファイル | 中身 |
|---|---|
| `canvaswears-brand.pen` | Pencilファイル。ロゴ5案、キャッチコピー6案、色と書体 |
| `brand-board.png` | 上のPencilファイルと同じ内容の見本画像 |
| `logo-<案>.svg` / `logo-<案>-on-dark.svg` | 各案のシンボル（明るい背景用 / 暗い背景用） |
| `marks.mjs` | シンボルの形の定義。Pencilファイル・SVG・サイトはこの形をもとにしている |
| `build-pen.mjs` | PencilファイルとSVGを作り直すスクリプト（`node brand/build-pen.mjs`） |

## ロゴ

Tシャツの形は使わない。案は5つ（`tiles` 柄タイル / `hanger` ハンガー×キャンバス /
`pencil` 鉛筆×キャンバス / `hug` Cがキャンバスを抱く / `label` 織りネーム）。
サイトにはいま `tiles` を仮に入れてある。**どれを採用するかは未決定。**
決まったら `app/components/BrandLogo.tsx` の `CanvasMark` をその案の形に差し替え、この節を書き直す。

文字は Outfit で `CANVAS`（700）＋ `WEARS`（300）、字間 0.06em。サイトでは画像ではなくコードで描いている。

- 朱と墨の役割を入れ替えない
- 暗い背景では墨の部分と文字を生成り（`#FBF7F2`）にする。朱色はそのまま

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
