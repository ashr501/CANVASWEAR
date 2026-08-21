# デプロイ手順 — マルチサイト構成

1つのShopifyストア（BridesmaidsJP）を、3つの独立したサイトとして配信します。

| BRAND_ID | サイト | 中身 |
|---|---|---|
| `bridal` | BRILLAR | ウェディングドレス・アクセサリー・ベール（bridesmaids.jpから分離） |
| `elegant-plus` | HAORI+ | プラスサイズ羽織物 |
| `avant-garde` | NOCT. | V系×Y2K |

サイトを増やすときは `app/lib/brands.ts` にブランドを1つ足し、
`app/styles/app.css` に同じidの `[data-brand="..."]` ブロックを足すだけです。

---

## 推奨: Shopify Oxygenにデプロイする

Oxygenは**Shopify公式のHydrogen専用ホスティング**で、有料Shopifyプラン（Basic以上）に
含まれています。**ホスティング費用の追加はありません。**

Vercelとの一番の違いは、**Storefront APIトークンを手で扱わなくて済む**ことです。
Hydrogenストアフロントを作るとトークンが自動発行され、デプロイ時に
`PUBLIC_STORE_DOMAIN` / `PUBLIC_STOREFRONT_API_TOKEN` /
`PRIVATE_STOREFRONT_API_TOKEN` が自動的に環境変数として注入されます。

### 手順（サイト1つあたり）

1. Shopify管理画面 → **設定** → **アプリと販売チャネル** → **Hydrogen** を追加
2. **ストアフロントを作成**（例: `BRILLAR`）
3. ローカルでリンクしてデプロイ
   ```bash
   npx shopify hydrogen link      # 作成したストアフロントを選ぶ
   npx shopify hydrogen env pull  # トークン等を .env に取得（ローカル開発用）
   npx shopify hydrogen deploy
   ```
4. Shopify管理画面のストアフロント設定で、**環境変数 `BRAND_ID` を追加**
   （`bridal` / `elegant-plus` / `avant-garde`）
5. 独自ドメインを接続

3サイト運用する場合は、**Hydrogenストアフロントを3つ作り**、それぞれに別の
`BRAND_ID` を設定します。

### Oxygenでも必要な作業

- 商品とコレクションを、そのHydrogenストアフロント（販売チャネル）に**公開**すること。
  これをしないとトークンが正しくてもAPIは空を返します。

### GitHub連携

ストアフロント設定でGitHubリポジトリを接続すると、プッシュのたびに自動デプロイされ、
プルリクエストごとにプレビューURLが発行されます。

---

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
5. **アプリをインストール**して、Storefront APIアクセストークンをコピー

### ⚠️ 見落としやすい: 販売チャネルへの公開

カスタムアプリを作ると、そのアプリ自身が1つの販売チャネルになります。
**商品とコレクションをそのチャネルに公開していないと、トークンが正しくても
Storefront APIは空の結果を返します**（サイトは真っ白 or「商品がありません」）。

Shopify管理画面 → **商品** → 全選択 → **一括編集** → 「販売チャネルとアプリ」で
作成したアプリにチェック。コレクションも同様に公開してください。

### ストアドメイン

`PUBLIC_STORE_DOMAIN` には **`bridesmaidsjp.myshopify.com`** を使ってください。
独自ドメイン（`shop.bridesmaids.jp`）はリダイレクトが挟まりAPI呼び出しに失敗することがあります。

---

## まず見たい人向け: 1デプロイで両ブランドをプレビュー

環境変数を設定しなくても、1つのデプロイで両方のブランドを確認できます
（ブランドはリクエスト時に ?brand= パラメータ → Cookie → ホスト名 → BRAND_ID の順で解決）。

| URL | 表示 |
|---|---|
| `https://xxx.vercel.app/` | HAORI+（白・ラグジュアリー） |
| `https://xxx.vercel.app/?brand=bridal` | BRILLAR（ブライダル） |
| `https://xxx.vercel.app/?brand=avant-garde` | NOCT.（黒・アバンギャルド） |
| `https://xxx.vercel.app/?brand=elegant-plus` | HAORI+に戻す |

一度 ?brand= で切り替えるとCookieに保存され、ページ遷移しても維持されます。
ホスト名に `noct` / `brillar` / `bridal` を含む独自ドメインを接続すると自動で切り替わります。

本番運用では下記の通りプロジェクトを分けて `BRAND_ID` を固定してください。

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

## ブランド3 のデプロイ（ブライダル / BRILLAR）

bridesmaids.jp からウェディングドレスとアクセサリーを切り出した独立サイトです。

### 1. Vercelで3つ目のプロジェクト作成
- **同じGitHubリポジトリ**を再度選択
- **プロジェクト名**: `brillar`（例）

### 2. 環境変数
```
BRAND_ID                    = bridal        ← ここだけ変える
SESSION_SECRET              = (別のランダム文字列)
PUBLIC_STORE_DOMAIN         = your-store.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN = (同じShopifyトークンでOK)
BRAND3_STORE_DOMAIN         = your-store.myshopify.com
BRAND3_STOREFRONT_API_TOKEN = (同上)
```

### 3. デプロイ
- `https://brillar.vercel.app` でアクセス可能に

---

## 結果

| | ブランド1 | ブランド2 | ブランド3 |
|---|---|---|---|
| URL | haori-plus.vercel.app | noct-store.vercel.app | brillar.vercel.app |
| デザイン | 白基調・ラグジュアリー | 黒基調・アバンギャルド | アイボリー・ブライダル |
| 取扱 | 羽織物 | V系×Y2K | ウェディングドレス・アクセサリー |
| Shopify | 同じ1契約 | 同じ1契約 | 同じ1契約 |
| コード | 同じリポジトリ | 同じリポジトリ | 同じリポジトリ |

---

## 独自ドメインを後から追加する場合

Vercelプロジェクト → **Settings** → **Domains** → ドメインを追加
```
haori-plus.com  →  ブランド1プロジェクトに追加
noct-store.com  →  ブランド2プロジェクトに追加
brillar.jp      →  ブランド3プロジェクトに追加
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

### ブランド3: BRILLAR（BRAND_ID=bridal）
- [ ] トップページがアイボリー基調・トープで表示される
- [ ] ヘッダーに「ウェディングドレス / アクセサリー / ベール・ブーケ / 全商品」が並ぶ
- [ ] 「アクセサリー」に実在の商品（イヤリング・ヘッドピース等）が表示される
- [ ] 商品一覧にHAORI+ / NOCT.の商品が混ざっていない

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
| コレクション | `elegant-all` | HAORI+ 全アイテム（tag: brand:elegant-plus） |
| コレクション | `noct-all` | NOCT. 全アイテム（tag: brand:avant-garde） |
| コレクション | `bridal-all` | BRILLAR 全アイテム（301点） |
| コレクション | `bridal-new-arrivals` | BRILLAR 新着 |
| コレクション | `bridal-dress` | BRILLAR ウェディングドレス（3点） |
| コレクション | `bridal-accessories` | BRILLAR アクセサリー（272点） |
| コレクション | `bridal-veil` | BRILLAR ベール・ブーケ（26点） |
| デモ商品 | - | 計12点（HAORI+/NOCT.用のデモ・実商品が揃ったら削除OK） |

※デモ商品は在庫追跡なしで作成しているため、そのまま購入テスト可能です。
実際に販売しないよう、テスト後は商品をDRAFTに戻すか削除してください。

---

## ブライダルサイト（BRILLAR）の商品の入れ方

`bridal-*` はすべてスマートコレクションなので、条件に合う商品は自動で入ります。

| コレクション | 自動で入る条件 | 手動で追加するタグ |
|---|---|---|
| `bridal-dress` | 商品名に「ウェディングドレス」「ウエディングドレス」 | `bridal:dress` |
| `bridal-accessories` | 商品タイプが `【アクセサリー】…` | `bridal:accessory` |
| `bridal-veil` | 商品タイプが `【小物】ベール` `【小物】ブーケ` | `bridal:veil` |
| `bridal-all` | 上記すべて | `brand:bridal` |

条件に合わない商品をブライダルサイトに載せたいときは、Shopifyの商品編集画面で
右の「タグ」に上表のタグを追加してください。数分で反映されます。

現在ウェディングドレスは在庫3点のみです。ドレスを増やす場合は、商品名に
「ウェディングドレス」を含めるか `bridal:dress` タグを付けてください。

---

## 将来、サイトを完全に独立させる

いまは3サイトが1つのShopifyストア（BridesmaidsJP）を共有していますが、
**コードを変えずに、ブランド単位で別のShopifyストアへ移せる**設計にしてあります。

各ブランドは `app/lib/brands.ts` の `envPrefix` で自分の接続先を持ちます。

| ブランド | 接続先を決める環境変数 |
|---|---|
| HAORI+ | `BRAND1_STORE_DOMAIN` / `BRAND1_STOREFRONT_API_TOKEN` |
| NOCT. | `BRAND2_STORE_DOMAIN` / `BRAND2_STOREFRONT_API_TOKEN` |
| BRILLAR | `BRAND3_STORE_DOMAIN` / `BRAND3_STOREFRONT_API_TOKEN` |

### 独立させる手順

1. 新しいShopifyストアを契約する
2. 商品を移行する（Shopifyの CSV インポート、または移行アプリ）
3. 新ストアでHydrogenストアフロントを作り、トークンを取得
4. そのサイトの `BRAND3_STORE_DOMAIN` / `BRAND3_STOREFRONT_API_TOKEN` を
   新ストアの値に差し替える

**コードの変更もデプロイのやり直しも不要です。** 環境変数の入れ替えだけで、
そのサイトだけが新しいストアを見るようになります。

さらにリポジトリごと分けたい場合は、`app/lib/brands.ts` から他のブランドを
削除するだけで単一ブランドのリポジトリになります。

### 独立させると発生するもの

- Shopifyプラン料金がストアの数だけかかります
- 在庫・注文・顧客は完全に分かれます（同じ在庫を共有できなくなります）
- 逆に、屋号・決済・配送設定・ドメインを完全に分けられます
