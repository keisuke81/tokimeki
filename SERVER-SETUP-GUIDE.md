# サーバー契約とデプロイ環境構築ガイド

お名前.com で取得済みのドメインを使用して、開発環境（サブドメイン）と本番環境（ドメイン正規ルート）を構築し、GitHub Actions で自動デプロイできるようにする手順です。

## 📋 目次

1. [サーバー契約](#1-サーバー契約)
2. [ドメインとサーバーの連携](#2-ドメインとサーバーの連携)
3. [WordPress のインストール](#3-wordpressのインストール)
4. [GitHub Actions の設定](#4-github-actionsの設定)
5. [デプロイの確認](#5-デプロイの確認)

---

## 1. サーバー契約

### 1.1 推奨サーバー

WordPress サイトに適したサーバーを選びましょう。

#### おすすめサーバー（日本国内）

1. **エックスサーバー**（推奨）

   - 月額 1,100 円〜（10 日間無料お試しあり）
   - WordPress に最適化
   - サブドメイン無制限
   - SSH 接続可能
   - 公式サイト: https://www.xserver.ne.jp/

2. **さくらのレンタルサーバー**

   - 月額 550 円〜
   - 安定性が高い
   - SSH 接続可能（スタンダードプラン以上）
   - 公式サイト: https://www.sakura.ne.jp/

3. **ロリポップ！レンタルサーバー**
   - 月額 330 円〜
   - コスパが良い
   - SSH 接続可能（ライトプラン以上）
   - 公式サイト: https://lolipop.jp/

#### 選択のポイント

- ✅ **SSH 接続が可能**（GitHub Actions で自動デプロイするために必須）
- ✅ **サブドメインが使える**（開発環境用）
- ✅ **PHP 8.0 以上**（WordPress 推奨）
- ✅ **MySQL/MariaDB 対応**

### 1.2 サーバー契約手順（エックスサーバーを例に）

1. **エックスサーバーの公式サイトにアクセス**

   - https://www.xserver.ne.jp/

2. **サーバー ID を取得**

   - 「サーバー ID」を選択（例：`sv1234.xserver.jp`）
   - プランを選択（WordPress なら「X10 プラン」以上推奨）

3. **契約完了後、サーバーパネルにログイン**
   - サーバーパネルの URL: https://www.xserver.ne.jp/login_server.php
   - サーバー ID とパスワードでログイン

---

## 2. ドメインとサーバーの連携

### 2.1 お名前.com での DNS 設定

お名前.com で取得済みのドメインを、契約したサーバーに紐付けます。

#### ステップ 1: サーバーのネームサーバー情報を確認

サーバー契約後、サーバー提供者から以下の情報が提供されます：

- **ネームサーバー 1**: `ns1.xserver.jp`（例）
- **ネームサーバー 2**: `ns2.xserver.jp`（例）
- **ネームサーバー 3**: `ns3.xserver.jp`（例）

※サーバー提供者によって異なります。サーバーパネルまたはメールで確認してください。

#### ステップ 2: お名前.com でネームサーバーを変更

1. **お名前.com にログイン**

   - https://www.onamae.com/

2. **ドメイン一覧を開く**

   - 「ドメイン」→「ドメイン一覧」をクリック

3. **ネームサーバーの変更**

   - 対象ドメインの「ネームサーバー」をクリック
   - 「ネームサーバーを変更する」を選択
   - サーバー提供者から取得したネームサーバー情報を入力
     ```
     ネームサーバー1: ns1.xserver.jp
     ネームサーバー2: ns2.xserver.jp
     ネームサーバー3: ns3.xserver.jp
     ```
   - 「確認画面へ進む」→「変更する」をクリック

4. **反映を待つ**
   - DNS の反映には**24〜48 時間**かかることがあります
   - 反映状況は以下のコマンドで確認できます：
     ```bash
     # macOSの場合
     dig yourdomain.com NS
     ```

### 2.2 サーバー側でのドメイン設定

#### ステップ 1: メインドメインの追加

1. **サーバーパネルにログイン**

   - エックスサーバーの場合: https://www.xserver.ne.jp/login_server.php

2. **ドメイン設定を開く**

   - 「ドメイン設定」→「ドメイン追加」をクリック

3. **ドメインを追加**
   - 取得済みのドメイン（例：`example.com`）を入力
   - 「確認画面へ進む」→「追加する」をクリック

#### ステップ 2: サブドメインの追加（開発環境用）

1. **サブドメイン設定を開く**

   - 「ドメイン設定」→「サブドメイン設定」をクリック

2. **サブドメインを追加**

   - サブドメイン名: `dev`（例：`dev.example.com`）
   - ドメイン: `example.com`を選択
   - ディレクトリ: `/dev`（自動で設定される場合が多い）
   - 「確認画面へ進む」→「追加する」をクリック

3. **確認**
   - サブドメインが追加されたことを確認
   - 通常、数分で利用可能になります

---

## 3. WordPress のインストール

### 3.1 本番環境（ドメイン正規ルート）へのインストール

1. **サーバーパネルで WordPress をインストール**

   - エックスサーバーの場合：
     - 「WordPress 簡単インストール」を開く
     - ドメイン: `example.com`を選択
     - インストール先: `/`（ルート）
     - データベース: 新規作成
     - サイト名、ユーザー名、パスワードを設定
     - 「インストール」をクリック

2. **インストール完了後の確認**
   - `https://example.com` にアクセス
   - WordPress の初期画面が表示されることを確認

### 3.2 開発環境（サブドメイン）へのインストール

1. **サブドメインにも WordPress をインストール**

   - エックスサーバーの場合：
     - 「WordPress 簡単インストール」を開く
     - ドメイン: `dev.example.com`を選択
     - インストール先: `/`（ルート）
     - データベース: 新規作成（本番とは別の DB）
     - サイト名、ユーザー名、パスワードを設定
     - 「インストール」をクリック

2. **インストール完了後の確認**
   - `https://dev.example.com` にアクセス
   - WordPress の初期画面が表示されることを確認

### 3.3 親テーマのインストール

両方の環境で、親テーマ「Twenty Twenty-Four」をインストール：

1. **WordPress 管理画面にログイン**

   - 本番: `https://example.com/wp-admin`
   - 開発: `https://dev.example.com/wp-admin`

2. **テーマをインストール**
   - 「外観」→「テーマ」→「新規追加」
   - 「Twenty Twenty-Four」を検索してインストール
   - 有効化は不要（子テーマを使用するため）

---

## 4. GitHub Actions の設定

### 4.1 GitHub Secrets の設定

GitHub リポジトリに、サーバー接続情報をシークレットとして登録します。

#### ステップ 1: GitHub リポジトリを開く

1. GitHub でリポジトリを開く
2. 「Settings」→「Secrets and variables」→「Actions」をクリック

#### ステップ 2: シークレットを追加

以下のシークレットを追加します：

##### 開発環境（stage ブランチ用）

- `STAGE_HOST`: 開発環境のサーバーホスト名（例：`dev.example.com`）
- `STAGE_USER`: SSH ユーザー名（サーバー提供者から取得）
- `STAGE_SSH_KEY`: SSH 秘密鍵（後述）
- `STAGE_PATH`: WordPress のルートパス（例：`/home/username/dev.example.com/public_html`）

##### 本番環境（main ブランチ用）

- `PROD_HOST`: 本番環境のサーバーホスト名（例：`example.com`）
- `PROD_USER`: SSH ユーザー名（通常は開発環境と同じ）
- `PROD_SSH_KEY`: SSH 秘密鍵（開発環境と同じ鍵を使用可能）
- `PROD_PATH`: WordPress のルートパス（例：`/home/username/example.com/public_html`）

#### ステップ 3: SSH 鍵の生成と登録

1. **ローカルで SSH 鍵を生成**（まだ持っていない場合）

   ```bash
   # SSH鍵を生成（すでにある場合はスキップ）
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

   # 公開鍵を表示（サーバーに登録する用）
   cat ~/.ssh/github_actions_deploy.pub
   ```

2. **サーバーに公開鍵を登録**

   - サーバーに SSH 接続：

     ```bash
     ssh username@example.com
     ```

   - サーバー側で公開鍵を登録：

     ```bash
     # .sshディレクトリを作成（存在しない場合）
     mkdir -p ~/.ssh
     chmod 700 ~/.ssh

     # authorized_keysに公開鍵を追加
     echo "（公開鍵の内容を貼り付け）" >> ~/.ssh/authorized_keys
     chmod 600 ~/.ssh/authorized_keys
     ```

3. **GitHub Secrets に秘密鍵を登録**

   - ローカルで秘密鍵を表示：

     ```bash
     cat ~/.ssh/github_actions_deploy
     ```

   - GitHub リポジトリの「Secrets and variables」→「Actions」→「New repository secret」をクリック
   - Name: `STAGE_SSH_KEY`（開発環境用）
   - Secret: 秘密鍵の内容を貼り付け
   - 「Add secret」をクリック

   - 同様に `PROD_SSH_KEY` も追加（同じ鍵を使用する場合は同じ内容を貼り付け）

### 4.2 サーバーのパスを確認

サーバーに SSH 接続して、WordPress のルートパスを確認：

```bash
ssh username@example.com
pwd  # 現在のパスを確認
ls -la  # wp-config.phpがあるか確認
```

通常のパス例：

- エックスサーバー: `/home/username/example.com/public_html`
- さくらサーバー: `/home/username/www/example.com`
- ロリポップ: `/home/username/example.com`

### 4.3 GitHub Actions ワークフローの確認

`.github/workflows/` ディレクトリに以下のワークフローファイルが作成されていることを確認：

- `deploy-stage.yml`（開発環境用）
- `deploy-prod.yml`（本番環境用）

詳細は各ファイルを参照してください。

---

## 5. デプロイの確認

### 5.1 初回デプロイ

1. **stage ブランチにプッシュ**

   ```bash
   git checkout -b stage
   git add .
   git commit -m "Initial commit for staging"
   git push origin stage
   ```

2. **GitHub Actions の実行を確認**

   - GitHub リポジトリの「Actions」タブを開く
   - ワークフローが実行されていることを確認
   - 成功（緑のチェック）になるまで待つ

3. **開発環境の確認**

   - `https://dev.example.com` にアクセス
   - テーマが正しく適用されているか確認

### 5.2 本番環境へのデプロイ

1. **main ブランチにマージ**

   ```bash
   git checkout main
   git merge stage
   git push origin main
   ```

2. **GitHub Actions の実行を確認**

   - 「Actions」タブで本番環境のワークフローが実行されることを確認
   - 成功するまで待つ

3. **本番環境の確認**

   - `https://example.com` にアクセス
   - テーマが正しく適用されているか確認

---

## トラブルシューティング

### DNS が反映されない

- DNS の反映には 24〜48 時間かかることがあります
- 以下のコマンドで確認：
  ```bash
  dig example.com NS
  nslookup example.com
  ```

### SSH 接続ができない

- サーバー提供者に SSH 接続が有効か確認
- 公開鍵が正しく登録されているか確認
- ポート番号を確認（通常は 22）

### GitHub Actions が失敗する

- Secrets が正しく設定されているか確認
- サーバーのパスが正しいか確認
- SSH 鍵の権限を確認（`chmod 600`）

### ファイルがアップロードされない

- サーバーのディスク容量を確認
- ファイルのパーミッションを確認
- WordPress のパスが正しいか確認

---

## 次のステップ

- ✅ サーバー契約完了
- ✅ ドメイン連携完了
- ✅ WordPress インストール完了
- ✅ GitHub Actions 設定完了
- ✅ 自動デプロイ動作確認完了

これで、`stage`ブランチにプッシュすると開発環境に、`main`ブランチにプッシュすると本番環境に自動デプロイされるようになりました！
