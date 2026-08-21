# Multi-Site Hydrogen Storefront

1つのShopifyストア（BridesmaidsJP）をバックエンドに、複数のブランドサイトを運営するヘッドレスECです。

| BRAND_ID | ブランド | 取扱 | デザイン |
|---|---|---|---|
| `bridal` | **BRILLAR**（ブリラー） | ウェディングドレス・ブライダルアクセサリー | アイボリー×トープ |
| `elegant-plus` | **HAORI+**（ハオリプラス） | プラスサイズ向け羽織物 | 白×ゴールド・ラグジュアリー |
| `avant-garde` | **NOCT.**（ノクト） | V系×Y2K・40代以上向け | 黒×赤・アバンギャルド |

## 仕組み

- **バックエンド**: Shopify（商品・在庫・注文・決済） + BuckyDrop（ドロップシッピング仕入れ）
- **フロントエンド**: Shopify Hydrogen（Remix）+ Tailwind CSS
- サイトごとの商品は、そのブランド専用のShopifyコレクション（`collections.all`）で切り分け
- ブランドは `?brand=` パラメータ → Cookie → ホスト名 → 環境変数 `BRAND_ID` の順で解決

## サイトを1つ追加する

1. `app/lib/brands.ts` の `BRANDS` にブランドを1つ足す
   （名前・配色・ナビ・使うコレクションのhandle・`envPrefix` を書く）
2. `app/styles/app.css` に同じidの `[data-brand="<id>"]` ブロックを足す
3. Shopifyでそのブランド用のコレクションを作る
4. Vercelで新しいプロジェクトを作り `BRAND_ID=<id>` を設定する

コンポーネント側の分岐は `uiMode`（`elegant` / `bold`）で行うため、
ブランドを足しても各ページを触る必要はありません。

## ドキュメント

- [DEPLOY.md](./DEPLOY.md) — Vercelへのデプロイ手順・チェックリスト
- [BUCKYDROP.md](./BUCKYDROP.md) — BuckyDrop連携・商品追加の運用手順

## 開発

```bash
npm install
cp .env.example .env  # 環境変数を設定
npm run dev           # 開発サーバー
npm run build         # Oxygen用ビルド
npm run build:vercel  # Vercel用ビルド
npm run typecheck
```

## デプロイ先

**Shopify Oxygen（推奨・Shopifyプランに込みで追加費用なし）**

```bash
npx shopify hydrogen link      # Hydrogenストアフロントを選ぶ
npx shopify hydrogen deploy
```

Storefront APIトークンはOxygenが自動で注入するため、手で設定する必要はありません。
サイトごとに `BRAND_ID` だけShopify管理画面で設定します。

Vercelにも対応しています（`api/server.ts` がExpressアダプタ）。手順は
[DEPLOY.md](./DEPLOY.md) を参照してください。
