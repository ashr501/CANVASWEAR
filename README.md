# Multi-Brand Hydrogen Storefront

1つのShopifyストアをバックエンドに、2つのブランドサイトを運営するヘッドレスECです。

| ブランド | コンセプト | デザイン |
|---|---|---|
| **HAORI+**（ハオリプラス） | プラスサイズ向け羽織物 | 白×ゴールド・ラグジュアリー |
| **NOCT.**（ノクト） | V系×Y2K・40代以上向け | 黒×赤・アバンギャルド |

## 仕組み

- **バックエンド**: Shopify（商品・在庫・注文・決済） + BuckyDrop（ドロップシッピング仕入れ）
- **フロントエンド**: Shopify Hydrogen（Remix）+ Tailwind CSS
- 商品はタグ `brand:elegant-plus` / `brand:avant-garde` でブランド別に振り分け
- ブランドは `?brand=` パラメータ → Cookie → ホスト名 → 環境変数 `BRAND_ID` の順で解決

## ドキュメント

- [DEPLOY.md](./DEPLOY.md) — Vercelへのデプロイ手順・チェックリスト
- [BUCKYDROP.md](./BUCKYDROP.md) — BuckyDrop連携・商品追加の運用手順

## 開発

```bash
npm install
cp .env.example .env  # 環境変数を設定
npm run dev           # Shopify Oxygen互換の開発サーバー
npm run build:vercel  # Vercel用ビルド
npm run typecheck
```
