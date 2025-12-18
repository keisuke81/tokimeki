# GitHub Actions自動デプロイ設定ガイド

このドキュメントでは、GitHub Actionsを使って`stage`ブランチと`main`ブランチをプッシュしたときに、それぞれ開発環境と本番環境に自動デプロイする設定方法を説明します。

## 📋 前提条件

- ✅ GitHubリポジトリが作成済み
- ✅ サーバー契約済み（SSH接続可能）
- ✅ ドメインとサブドメインの設定完了
- ✅ WordPressが両環境にインストール済み

## 🔐 ステップ1: GitHub Secretsの設定

GitHubリポジトリに、サーバー接続情報をシークレットとして登録します。

### 1.1 GitHubリポジトリを開く

1. GitHubでリポジトリを開く
2. 「Settings」タブをクリック
3. 左メニューから「Secrets and variables」→「Actions」をクリック

### 1.2 開発環境用のシークレットを追加

以下のシークレットを追加します：

#### `STAGE_HOST`
- **Name**: `STAGE_HOST`
- **Secret**: 開発環境のサーバーホスト名
  - 例: `dev.example.com`
  - または: `sv1234.xserver.jp`（サーバー提供者のホスト名）

#### `STAGE_USER`
- **Name**: `STAGE_USER`
- **Secret**: SSHユーザー名
  - 例: `username`
  - サーバー提供者から取得したSSHユーザー名

#### `STAGE_SSH_KEY`
- **Name**: `STAGE_SSH_KEY`
- **Secret**: SSH秘密鍵の内容（後述）

#### `STAGE_PATH`
- **Name**: `STAGE_PATH`
- **Secret**: WordPressのルートパス
  - 例: `/home/username/dev.example.com/public_html`
  - サーバーにSSH接続して確認

### 1.3 本番環境用のシークレットを追加

同様に、本番環境用のシークレットを追加します：

#### `PROD_HOST`
- **Name**: `PROD_HOST`
- **Secret**: 本番環境のサーバーホスト名
  - 例: `example.com`

#### `PROD_USER`
- **Name**: `PROD_USER`
- **Secret**: SSHユーザー名（通常は開発環境と同じ）

#### `PROD_SSH_KEY`
- **Name**: `PROD_SSH_KEY`
- **Secret**: SSH秘密鍵の内容（開発環境と同じ鍵を使用可能）

#### `PROD_PATH`
- **Name**: `PROD_PATH`
- **Secret**: WordPressのルートパス
  - 例: `/home/username/example.com/public_html`

---

## 🔑 ステップ2: SSH鍵の生成と登録

### 2.1 SSH鍵を生成（まだ持っていない場合）

ローカルでSSH鍵を生成します：

```bash
# SSH鍵を生成
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# パスフレーズは空欄でOK（Enterを2回押す）
```

これで以下のファイルが生成されます：
- `~/.ssh/github_actions_deploy`（秘密鍵）
- `~/.ssh/github_actions_deploy.pub`（公開鍵）

### 2.2 公開鍵をサーバーに登録

#### 2.2.1 公開鍵の内容を確認

```bash
cat ~/.ssh/github_actions_deploy.pub
```

出力例：
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions-deploy
```

#### 2.2.2 サーバーにSSH接続

```bash
ssh username@example.com
```

#### 2.2.3 サーバー側で公開鍵を登録

サーバーに接続後、以下のコマンドを実行：

```bash
# .sshディレクトリを作成（存在しない場合）
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# authorized_keysに公開鍵を追加
echo "（公開鍵の内容を貼り付け）" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 確認
cat ~/.ssh/authorized_keys
```

#### 2.2.4 接続テスト

ローカルから、パスワードなしでSSH接続できるか確認：

```bash
ssh -i ~/.ssh/github_actions_deploy username@example.com
```

パスワードを聞かれずに接続できれば成功です。

### 2.3 GitHub Secretsに秘密鍵を登録

#### 2.3.1 秘密鍵の内容を確認

```bash
cat ~/.ssh/github_actions_deploy
```

出力例：
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW...
...
-----END OPENSSH PRIVATE KEY-----
```

#### 2.3.2 GitHub Secretsに追加

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」を開く
2. 「New repository secret」をクリック
3. 以下の情報を入力：
   - **Name**: `STAGE_SSH_KEY`
   - **Secret**: 秘密鍵の内容を**すべて**コピー&ペースト
4. 「Add secret」をクリック
5. 同様に `PROD_SSH_KEY` も追加（同じ鍵を使用する場合は同じ内容を貼り付け）

---

## 📍 ステップ3: サーバーのパスを確認

サーバーにSSH接続して、WordPressのルートパスを確認します。

### 3.1 サーバーに接続

```bash
ssh username@example.com
```

### 3.2 WordPressのルートパスを確認

```bash
# 現在のパスを確認
pwd

# wp-config.phpを探す
find ~ -name "wp-config.php" -type f 2>/dev/null

# または、一般的なパスを確認
ls -la ~/public_html/
ls -la ~/www/
ls -la ~/htdocs/
```

### 3.3 パスの例

サーバー提供者によって異なります：

- **エックスサーバー**: `/home/username/example.com/public_html`
- **さくらのレンタルサーバー**: `/home/username/www/example.com`
- **ロリポップ**: `/home/username/example.com`

確認したパスを、GitHub Secretsの `STAGE_PATH` と `PROD_PATH` に設定してください。

---

## 🚀 ステップ4: ワークフローの確認

`.github/workflows/` ディレクトリに以下のファイルが作成されていることを確認：

- `deploy-stage.yml`（開発環境用）
- `deploy-prod.yml`（本番環境用）

これらのファイルは、リポジトリにコミット&プッシュする必要があります。

---

## ✅ ステップ5: 初回デプロイのテスト

### 5.1 stageブランチを作成してプッシュ

```bash
# stageブランチを作成
git checkout -b stage

# 変更をコミット
git add .
git commit -m "Add GitHub Actions workflows"

# stageブランチをプッシュ
git push origin stage
```

### 5.2 GitHub Actionsの実行を確認

1. GitHubリポジトリの「Actions」タブを開く
2. 「Deploy to Staging Environment」ワークフローが実行されていることを確認
3. ワークフローをクリックして、実行状況を確認
4. すべてのステップが成功（緑のチェック）になるまで待つ

### 5.3 開発環境の確認

- `https://dev.example.com` にアクセス
- テーマが正しく適用されているか確認
- WordPress管理画面でテーマが有効化されているか確認

### 5.4 本番環境へのデプロイテスト

```bash
# mainブランチに切り替え
git checkout main

# stageブランチをマージ
git merge stage

# mainブランチをプッシュ
git push origin main
```

1. GitHub Actionsで「Deploy to Production Environment」が実行されることを確認
2. 成功するまで待つ
3. `https://example.com` にアクセスして確認

---

## 🔄 今後のデプロイフロー

### 開発環境へのデプロイ

```bash
# stageブランチで作業
git checkout stage

# 変更をコミット
git add .
git commit -m "Update theme"

# プッシュすると自動的に開発環境にデプロイ
git push origin stage
```

### 本番環境へのデプロイ

```bash
# stageブランチの変更をmainにマージ
git checkout main
git merge stage
git push origin main

# または、直接mainブランチで作業（非推奨）
git checkout main
git add .
git commit -m "Update theme"
git push origin main
```

---

## 🐛 トラブルシューティング

### GitHub Actionsが失敗する

#### エラー: "Host key verification failed"

- SSH鍵が正しく設定されているか確認
- `known_hosts` にサーバーのホストキーが追加されているか確認

#### エラー: "Permission denied (publickey)"

- 公開鍵がサーバーに正しく登録されているか確認
- SSHユーザー名が正しいか確認
- 秘密鍵の内容が正しくGitHub Secretsに登録されているか確認

#### エラー: "No such file or directory"

- サーバーのパス（`STAGE_PATH`、`PROD_PATH`）が正しいか確認
- WordPressが正しくインストールされているか確認

### ファイルがアップロードされない

- サーバーのディスク容量を確認
- ファイルのパーミッションを確認
- rsyncコマンドの除外設定を確認

### 手動でデプロイを実行したい場合

GitHubリポジトリの「Actions」タブで：
1. 実行したいワークフローを選択
2. 「Run workflow」ボタンをクリック
3. ブランチを選択して「Run workflow」をクリック

---

## 📝 注意事項

- ⚠️ **SSH鍵は絶対にリポジトリにコミットしないでください**
- ⚠️ **GitHub Secretsに登録する秘密鍵は、すべての内容を含めてください**（改行も含む）
- ⚠️ **本番環境へのデプロイは慎重に行ってください**
- ⚠️ **デプロイ前に必ず開発環境でテストしてください**

---

## 🎉 完了

これで、GitHub Actionsによる自動デプロイが設定されました！

- `stage`ブランチにプッシュ → 開発環境（`dev.example.com`）に自動デプロイ
- `main`ブランチにプッシュ → 本番環境（`example.com`）に自動デプロイ

開発効率が大幅に向上します！

