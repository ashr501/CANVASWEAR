# デプロイ手順 — 2ブランド Vercel構成

## 前提
- GitHubリポジトリにプッシュ済み
- Vercelアカウント作成済み (vercel.com)
- ShopifyのStorefront APIトークン取得済み

---

## Shopify APIトークンの取得方法

1. Shopify管理画面 → **設定** → **アプリと販売チャネル**
2. 「**Headlessチャネル**」または「カスタムアプリを開発」
3. **Storefront API アクセストークン**を作成
4. 以下の権限を有効にする：
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_collection_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_write_customers`

---

## ブランド1 のデプロイ（エレガントプラス）

### 1. Vercelで新しいプロジェクト作成
- vercel.com → **Add New Project**
- GitHubリポジトリを選択: `ashr501/-`
- **プロジェクト名**: `haori-luxe`（例）

### 2. 環境変数を設定（Vercel管理画面）
```
BRAND_ID                    = elegant-plus
SESSION_SECRET              = (ランダムな長い文字列)
PUBLIC_STORE_DOMAIN         = your-store.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN = (Shopifyで取得したトークン)
BRAND1_STORE_DOMAIN         = your-store.myshopify.com
BRAND1_STOREFRONT_API_TOKEN = (同上)
```

### 3. デプロイ
- **Deploy** ボタンを押す
- `https://haori-luxe.vercel.app` でアクセス可能に

---

## ブランド2 のデプロイ（アバンギャルド）

### 1. Vercelで別プロジェクト作成
- **同じGitHubリポジトリ**を再度選択
- **プロジェクト名**: `kuro-fashion`（例）

### 2. 環境変数（ブランド1と異なる部分だけ変更）
```
BRAND_ID                    = avant-garde   ← ここだけ変える
SESSION_SECRET              = (別のランダム文字列)
PUBLIC_STORE_DOMAIN         = your-store.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN = (同じShopifyトークンでOK)
BRAND2_STORE_DOMAIN         = your-store.myshopify.com
BRAND2_STOREFRONT_API_TOKEN = (同上)
```

### 3. デプロイ
- `https://kuro-fashion.vercel.app` でアクセス可能に

---

## 結果

| | ブランド1 | ブランド2 |
|---|---|---|
| URL | haori-luxe.vercel.app | kuro-fashion.vercel.app |
| デザイン | 白基調・ラグジュアリー | 黒基調・アバンギャルド |
| Shopify | 同じ1契約 | 同じ1契約 |
| コード | 同じリポジトリ | 同じリポジトリ |

---

## 独自ドメインを後から追加する場合

Vercelプロジェクト → **Settings** → **Domains** → ドメインを追加
```
haori-luxe.com  →  ブランド1プロジェクトに追加
kuro-fashion.com →  ブランド2プロジェクトに追加
```
DNS設定はVercerが自動で案内してくれます。
