# VercelでのWordPressデプロイについて

## ⚠️ 問題点

Vercelは**静的サイトホスティングサービス**です。PHPベースのWordPressは直接動作しません。

## ✅ 解決方法

WordPressサイトをVercelで公開するには、以下の3つの方法があります：

---

## 方法1: WordPressを静的サイトとしてエクスポート（推奨：最も簡単）

WordPressサイトを静的HTMLとしてエクスポートし、Vercelにデプロイします。

### 手順

1. **WordPressにプラグインをインストール**

   以下のいずれかのプラグインをインストール：
   - **Simply Static**（無料、最も人気）
   - **WP2Static**（無料）
   - **Static HTML Output**（無料）

2. **プラグインで静的サイトをエクスポート**

   - WordPress管理画面でプラグインを有効化
   - エクスポート設定を開く
   - エクスポート先を選択（ローカルまたはZIP）
   - 「Generate Static Site」をクリック

3. **エクスポートされたファイルをVercelにデプロイ**

   ```bash
   # エクスポートされたフォルダに移動
   cd /path/to/exported-site
   
   # Vercel CLIでデプロイ
   vercel
   ```

   または、Vercelのダッシュボードから：
   - 「Add New Project」をクリック
   - エクスポートされたフォルダをドラッグ&ドロップ
   - デプロイ完了

### メリット・デメリット

✅ **メリット**
- 簡単で確実
- 無料プラグインで実現可能
- 高速な静的サイト

❌ **デメリット**
- 動的な機能（コメント、検索など）が動作しない
- 更新のたびに再エクスポートが必要

---

## 方法2: Headless WordPress（上級者向け）

WordPressをバックエンド（API）として使い、フロントエンドをNext.jsなどで構築します。

### 必要なもの

- WordPress REST APIの知識
- Next.js/Reactの知識
- 開発時間

### 手順

1. **WordPressをHeadlessモードで設定**
   - WordPress REST APIを有効化
   - 必要に応じてWPGraphQLプラグインをインストール

2. **Next.jsプロジェクトを作成**

   ```bash
   npx create-next-app@latest tokimeki-frontend
   ```

3. **WordPress APIからデータを取得**

   ```javascript
   // pages/index.js または app/page.js
   export async function getStaticProps() {
     const res = await fetch('https://your-wordpress-site.com/wp-json/wp/v2/posts')
     const posts = await res.json()
     return { props: { posts } }
   }
   ```

4. **Vercelにデプロイ**

   ```bash
   vercel
   ```

### メリット・デメリット

✅ **メリット**
- 動的な機能も実装可能
- モダンな開発環境
- SEO対応可能

❌ **デメリット**
- 開発コストが高い
- WordPressの管理画面とフロントエンドが分離される

---

## 方法3: WordPress対応のホスティングサービスを使用（最も確実）

Vercelではなく、WordPress専用のホスティングサービスを使用します。

### おすすめのホスティングサービス

#### 無料・低価格
- **WordPress.com**（無料プランあり）
- **Xserver**（月額約1,000円）
- **エックスサーバー**（月額約1,000円）
- **ConoHa WING**（月額約1,000円）

#### 中級
- **Kinsta**（月額約3,000円〜）
- **WP Engine**（月額約4,000円〜）

#### 開発・ステージング環境向け
- **Local by Flywheel**（ローカル開発環境、無料）
- **MAMP PRO**（ローカル開発環境、有料）

### 手順（一般的なレンタルサーバーの場合）

1. **サーバーにWordPressをインストール**
   - サーバーのコントロールパネルからWordPressをインストール
   - または、手動でアップロード

2. **テーマファイルをアップロード**
   - FTP/SFTPで `wp-content/themes/tokimeki-child/` をアップロード

3. **データベースをインポート**（必要に応じて）
   - phpMyAdminからデータベースをインポート

---

## 🎯 推奨される方法

### クライアントに共有するだけの場合

**方法1（静的エクスポート）** が最も簡単です：

1. Simply Staticプラグインをインストール
2. 静的サイトをエクスポート
3. Vercelにデプロイ
4. クライアントにURLを共有

### 本格的な運用を考える場合

**方法3（WordPress対応ホスティング）** を推奨します。

---

## 📝 次のステップ

1. **目的を明確にする**
   - クライアントに共有するだけ → 方法1
   - 本格運用 → 方法3
   - モダンな開発 → 方法2

2. **選択した方法に従って進める**

3. **必要に応じてサポートを依頼**

どの方法を選択しますか？選択に応じて、より詳細な手順を提供します。

