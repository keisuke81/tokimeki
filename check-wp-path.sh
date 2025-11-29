#!/bin/bash

# ============================================
# WordPressパス確認スクリプト
# ============================================
# サーバー上のWordPressの実際のパスを確認します
# ============================================

STAGING_HOST="sv6007.wpx.ne.jp"
STAGING_USER="wp020865"
BASE_PATH="/home/wp020865"

echo "============================================"
echo "WordPressパス確認"
echo "============================================"
echo "サーバー: $STAGING_USER@$STAGING_HOST"
echo "ベースパス: $BASE_PATH"
echo ""

echo "📁 一般的なWordPressのパスを確認中..."
echo ""

# 一般的なパスを確認
PATHS=(
  "$BASE_PATH"
  "$BASE_PATH/public_html"
  "$BASE_PATH/www"
  "$BASE_PATH/htdocs"
  "$BASE_PATH/html"
)

for path in "${PATHS[@]}"; do
  echo "確認中: $path"
  if ssh "$STAGING_USER@$STAGING_HOST" "test -f $path/wp-config.php" 2>/dev/null; then
    echo "✅ WordPressが見つかりました: $path"
    echo ""
    echo "このパスを deploy-theme.sh の STAGING_WP_PATH に設定してください"
    exit 0
  fi
done

echo ""
echo "❌ WordPressのパスが見つかりませんでした"
echo ""
echo "手動で確認する方法:"
echo "1. SSHでサーバーに接続: ssh $STAGING_USER@$STAGING_HOST"
echo "2. 以下のコマンドで wp-config.php を探す:"
echo "   find $BASE_PATH -name wp-config.php -type f"
echo ""
echo "または、FTPクライアントでサーバーに接続して"
echo "wp-config.php ファイルがあるフォルダを確認してください"

