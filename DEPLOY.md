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
- **プロジェクト名**: `haori-plus`（例）

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
- `https://haori-plus.vercel.app` でアクセス可能に

---

## ブランド2 のデプロイ（アバンギャルド）

### 1. Vercelで別プロジェクト作成
- **同じGitHubリポジトリ**を再度選択
- **プロジェクト名**: `noct-store`（例）

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
- `https://noct-store.vercel.app` でアクセス可能に

---

## 結果

| | ブランド1 | ブランド2 |
|---|---|---|
| URL | haori-plus.vercel.app | noct-store.vercel.app |
| デザイン | 白基調・ラグジュアリー | 黒基調・アバンギャルド |
| Shopify | 同じ1契約 | 同じ1契約 |
| コード | 同じリポジトリ | 同じリポジトリ |

---

## 独自ドメインを後から追加する場合

Vercelプロジェクト → **Settings** → **Domains** → ドメインを追加
```
haori-plus.com  →  ブランド1プロジェクトに追加
noct-store.com →  ブランド2プロジェクトに追加
```
DNS設定はVercerが自動で案内してくれます。

---

## デプロイ後チェックリスト

接続ストア: **BridesmaidsJP** (`shop.bridesmaids.jp` / JPY)。
コレクションとデモ商品は設定済み（2026-07-07）。

### ブランド1: HAORI+（BRAND_ID=elegant-plus）
- [ ] トップページが白基調・ゴールドで表示される
- [ ] 「おすすめ」にHAORI+商品6点（羽織「白露」など）が表示される
- [ ] 「新着」に4点表示される
- [ ] 商品一覧にNOCT.の商品が混ざっていない
- [ ] 商品ページでサイズLL〜5Lが選択できる

### ブランド2: NOCT.（BRAND_ID=avant-garde）
- [ ] トップページが黒基調・赤アクセントで表示される
- [ ] 「SELECTION」にNOCT.商品4点（「零時」など）が表示される
- [ ] 商品一覧にHAORI+の商品が混ざっていない
- [ ] 商品画像がモノクロ表示→ホバーでカラーになる

### 共通
- [ ] カートに追加→ドロワーが開く
- [ ] チェックアウトでShopifyの決済画面に遷移する
- [ ] スマホ表示が崩れていない

### Shopifyストア側の設定済みリソース
| リソース | ハンドル | 内容 |
|---|---|---|
| コレクション | `elegant-featured` | HAORI+ おすすめ（6商品） |
| コレクション | `elegant-new-arrivals` | HAORI+ 新着（4商品） |
| コレクション | `noct-featured` | NOCT. SELECTION（4商品） |
| コレクション | `noct-new-arrivals` | NOCT. NEW IN（4商品） |
| デモ商品 | - | 計12点（デモ用・実商品が揃ったら削除OK） |

※デモ商品は在庫追跡なしで作成しているため、そのまま購入テスト可能です。
実際に販売しないよう、テスト後は商品をDRAFTに戻すか削除してください。
