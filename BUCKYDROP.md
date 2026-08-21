# BuckyDrop ドロップシッピング 連携・運用ガイド

このプロジェクトは「1つのShopifyストア + 2つのブランドサイト（HAORI+ / NOCT.）」構成です。
BuckyDropで仕入れた商品は**タグ付けだけ**でどちらのサイトに表示するか振り分けられます。

---

## 全体の流れ

```
BuckyDropで商品選定（Taobao/1688）
        ↓ プッシュ
Shopifyに商品が入る（この時点ではどちらのサイトにも出ない）
        ↓ タグ付け（重要！）
brand:elegant-plus → HAORI+ のサイトに表示
brand:avant-garde  → NOCT. のサイトに表示
        ↓
注文が入る → BuckyDropが自動で買付・検品・発送
```

---

## 1. 初回セットアップ（1回だけ）

### 1-1. ShopifyストアとBuckyDropを連携

1. [BuckyDrop](https://www.buckydrop.com/) にログイン
2. ダッシュボード → **Store Management**（店舗管理）
3. **Bind Store** → Shopify を選択
4. ストアURL（`shop.bridesmaids.jp` のmyshopifyドメイン）を入力
5. Shopify側で認証画面が出るので承認
   - ※Shopify App Store経由の場合は「BuckyDrop」アプリをインストール

### 1-2. 配送設定

BuckyDropダッシュボード → **Logistics Settings**:
- 日本向け配送ライン（EMS / 航空便 / 船便）を選択
- 推奨: 中量物は航空便、軽量物はEMS

### 1-3. 価格ルール設定

BuckyDropダッシュボード → **Pricing Rules**:
- 例: `販売価格 = (仕入価格 + 国際送料) × 2.5`
- 為替レート自動更新をON

---

## 2. 日常の商品追加フロー

### 2-1. 商品を探してプッシュ

1. BuckyDropの検索でTaobao/1688から商品を探す
   - HAORI+向け: 「大きいサイズ 羽織 カーディガン」「大码 开衫」
   - NOCT.向け: 「パンク 系 ロック」「暗黑 朋克」「y2k」
2. **Push to Store** でShopifyに送る（下書きまたは公開で入る）

### 2-2. タグ付け（これを忘れると表示されない！）

Shopify管理画面 → 商品 → 該当商品を開いてタグを追加:

| タグ | 効果 |
|---|---|
| `brand:elegant-plus` | HAORI+ のサイトに表示 |
| `brand:avant-garde` | NOCT. のサイトに表示 |
| `featured` | トップページ「おすすめ」に掲載 |
| `new` | トップページ「新着」に掲載 |

**一括タグ付けはClaude（このセッション）に依頼可能:**
「BuckyDropから入った商品10個にNOCT.のタグを付けて」のように伝えると
Shopify MCP経由で一括処理できます。

### 2-3. 商品情報を日本語化

BuckyDropから入る商品は中国語/英語の場合があるため:
- タイトル・説明文を日本語に書き換え（Claudeに依頼可）
- サイズ表記を日本サイズに変換（例: 2XL → LL）
- 公開ステータスを ACTIVE に変更

---

## 3. 注文処理フロー

1. どちらかのサイトで注文 → Shopifyに注文が入る
2. BuckyDropが注文を自動検知（Order Sync）
3. BuckyDropダッシュボードで買付を確定（自動買付設定も可）
4. BuckyDrop倉庫で検品 → 国際発送
5. 追跡番号がShopifyに自動反映 → 顧客に通知

---

## 4. 法令対応（日本でECを運営する場合の必須事項）

- [ ] **特定商取引法に基づく表記**ページを作成
  - Shopify管理画面 → 設定 → ポリシー
  - 販売者名・住所・電話番号・返品条件・引き渡し時期を明記
  - ドロップシッピングの場合「海外からの発送のため到着まで1〜3週間」等を記載
- [ ] **プライバシーポリシー**・**利用規約**の整備
- [ ] 返品ポリシー: 海外仕入れ商品の返品条件を明確に

---

## 5. トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| 商品がサイトに出ない | `brand:` タグが付いていない / ステータスがDRAFT |
| トップページに出ない | `featured` / `new` タグがない |
| 価格がおかしい | BuckyDropの価格ルールと為替設定を確認 |
| 在庫が合わない | BuckyDropのInventory Syncを確認 |
