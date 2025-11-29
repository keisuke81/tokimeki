# デプロイスクリプトの設定方法

## 🔴 エラーの原因

エラーメッセージ：
```
ssh: Could not resolve hostname your-staging-server.com
```

これは、`deploy-theme.sh` のサーバー情報がデフォルトのままになっているためです。

## ✅ 解決方法

### ステップ1: サーバー情報を確認

以下の情報をサーバー提供者から確認してください：

1. **ホスト名またはIPアドレス**
   - 例：`staging.example.com` または `192.168.1.100`

2. **SSHユーザー名**
   - 例：`username` または `ftp-username`

3. **WordPressのルートパス**
   - 例：`/var/www/html/staging` または `/home/username/public_html`

### ステップ2: スクリプトを編集

`deploy-theme.sh` を開いて、以下の部分を編集：

```bash
# サーバー情報
STAGING_HOST="your-staging-server.com"        # ← ここを実際のホスト名に変更
STAGING_USER="your-username"                  # ← ここを実際のユーザー名に変更
STAGING_WP_PATH="/path/to/wordpress"         # ← ここを実際のパスに変更
```

**例：**
```bash
STAGING_HOST="staging.example.com"
STAGING_USER="myusername"
STAGING_WP_PATH="/var/www/html/staging"
```

### ステップ3: SSH接続の確認

設定後、SSH接続が可能か確認：

```bash
ssh your-username@your-staging-server.com
```

接続できない場合は、**FTP/SFTPクライアントを使った手動デプロイ**を推奨します。

---

## 🔄 代替方法：FTP/SFTPクライアントを使う

SSH接続ができない、または設定が難しい場合は、FTPクライアントを使う方法が簡単です。

### FileZillaを使った手順

1. **FileZillaをダウンロード・インストール**
   - https://filezilla-project.org/

2. **サーバーに接続**
   - ホスト：FTPサーバーアドレス（例：`ftp.staging.example.com`）
   - ユーザー名：FTPユーザー名
   - パスワード：FTPパスワード
   - ポート：21（FTP）または 22（SFTP）

3. **テーマフォルダをアップロード**
   
   **ローカル側（左側）：**
   ```
   /Applications/MAMP/htdocs/tokimeki/wp-content/themes/tokimeki-child/
   ```
   
   **リモート側（右側）：**
   ```
   /wp-content/themes/tokimeki-child/
   ```
   
   または、WordPressのルートパスが異なる場合：
   ```
   /public_html/wp-content/themes/tokimeki-child/
   ```

4. **フォルダ全体をドラッグ&ドロップ**
   - `tokimeki-child` フォルダ全体をアップロード
   - 既存のファイルは上書きでOK

5. **ファイル権限の確認**
   - フォルダ：755
   - ファイル：644
   - FileZillaで右クリック → ファイルの権限 → 設定

---

## 📋 サーバー情報の確認方法

### レンタルサーバーの場合

サーバー提供者のコントロールパネル（例：cPanel、Plesk）で確認：

1. **FTP情報**
   - FTPアカウント設定
   - ホスト名、ユーザー名、パスワード

2. **SSH情報**
   - SSHアクセス設定
   - ホスト名、ユーザー名、ポート番号（通常22）

3. **WordPressのパス**
   - ファイルマネージャーで確認
   - 通常は `/public_html/` または `/www/` 配下

### よくあるパスの例

- **Xserver**: `/home/username/domain.com/public_html/`
- **エックスサーバー**: `/home/username/domain.com/public_html/`
- **ConoHa WING**: `/home/username/domain.com/public_html/`
- **さくらのレンタルサーバー**: `/home/username/www/domain.com/htdocs/`

---

## 🆘 トラブルシューティング

### SSH接続ができない

**原因：**
- SSHが有効になっていない
- ファイアウォールでブロックされている
- ポート番号が異なる

**解決方法：**
- FTP/SFTPクライアントを使う（推奨）
- サーバー提供者にSSHアクセスを有効化してもらう

### パスが分からない

**確認方法：**
1. FTPクライアントでサーバーに接続
2. `wp-config.php` ファイルを探す
3. そのファイルがあるフォルダがWordPressのルート
4. そこから `wp-content/themes/` がテーマのパス

### パーミッションエラー

**解決方法：**
- FTPクライアントでファイル権限を変更
- フォルダ：755
- ファイル：644

---

## 📞 次のステップ

1. サーバー情報を確認
2. スクリプトを編集、またはFTPクライアントを使用
3. テーマをアップロード
4. WordPress管理画面でテーマを有効化

