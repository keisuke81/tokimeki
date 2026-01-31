<?php

/**
 * TOKIMEKI Child enqueue
 */
add_action('wp_enqueue_scripts', function () {
  $theme_uri = get_stylesheet_directory_uri();
  $theme_dir = get_stylesheet_directory();

  // 1) 親テーマの style を先に（存在しないブロックテーマでも無害）
  $parent_style = get_template_directory_uri() . '/style.css';
  wp_enqueue_style('parent-style', $parent_style, [], null);

  // 2) 依存に global-styles を含めて “後勝ち” を保証
  //    ※ wp-block-library, wp-block-library-theme, global-styles を全部踏んでおく
  $deps = array_filter([
    'wp-block-library',
    'wp-block-library-theme',
    'global-styles',
    'parent-style',
  ], function ($h) {
    return wp_style_is($h, 'registered') || wp_style_is($h, 'enqueued');
  });

  // 簡易ヘルパ（filemtime でキャッシュ破り）
  $enqueue = function ($handle, $rel, $deps_local = []) use ($theme_uri, $theme_dir, $deps) {
    $path = $theme_dir . '/' . $rel;
    $ver  = file_exists($path) ? filemtime($path) : null;
    wp_enqueue_style($handle, $theme_uri . '/' . $rel, array_merge($deps, $deps_local), $ver);
  };

  // 3) 子テーマ CSS を “順番付き” で読み込み（base → components → pages）
  $enqueue('tokimeki-base',       'assets/css/base.css');
  $enqueue('tokimeki-components', 'assets/css/components.css', ['tokimeki-base']);
  $enqueue('tokimeki-pages',      'assets/css/pages.css',      ['tokimeki-components']);

  // 4) JS（不要なら後で外してOK）
  $js_path = $theme_dir . '/assets/js/main.js';
  wp_enqueue_script(
    'tokimeki-main',
    $theme_uri . '/assets/js/main.js',
    [],
    file_exists($js_path) ? filemtime($js_path) : null,
    true
  );

  // 5) ヒーローアニメーションJS
  $hero_js_path = $theme_dir . '/assets/js/hero-animation.js';
  wp_enqueue_script(
    'tokimeki-hero-animation',
    $theme_uri . '/assets/js/hero-animation.js',
    [],
    file_exists($hero_js_path) ? filemtime($hero_js_path) : null,
    true
  );
}, 999); // ← 重要：とても遅い優先度で “最後に” 差し込む

/**
 * エディタ側にもベースCSSを反映（見た目の差異を減らす）
 */
add_action('enqueue_block_editor_assets', function () {
  $theme_uri = get_stylesheet_directory_uri();
  $theme_dir = get_stylesheet_directory();

  foreach (['assets/css/base.css', 'assets/css/components.css'] as $rel) {
    $path = $theme_dir . '/' . $rel;
    if (file_exists($path)) {
      wp_enqueue_style(
        'tokimeki-editor-' . basename($rel, '.css'),
        $theme_uri . '/' . $rel,
        [],
        filemtime($path)
      );
    }
  }
});

/**
 * デバッグ用マーカー（確認後に削除OK）
 */
add_action('wp_head', function () {
  echo "<!-- tokimeki-child head loaded (late enqueue) -->\n";
}, 1000);

/**
 * ニュース記事のパーマリンクを /news/(ニュースタイトル) に変更
 */
add_filter('post_type_link', function ($post_link, $post) {
  if ($post->post_type === 'post' && $post->post_status === 'publish') {
    $post_link = home_url('/news/' . $post->post_name . '/');
  }
  return $post_link;
}, 10, 2);

/**
 * リライトルールを追加して /news/(ニュースタイトル) を認識させる
 */
add_action('init', function () {
  add_rewrite_rule(
    '^news/([^/]+)/?$',
    'index.php?name=$matches[1]',
    'top'
  );
});

/**
 * パーマリンク構造をフラッシュ（初回のみ）
 */
add_action('after_switch_theme', function () {
  flush_rewrite_rules();
});

/**
 * フロントページのプロジェクト説明文の配列
 * インデックス0-3に対応
 */
function tokimeki_get_project_descriptions()
{
  return [
    // インデックス0: プロジェクト1つ目
    '古くから日本の生活を支えた伝統工芸の技術を礎にしたラグジュアリーライフスタイルブランド。<br>奈良時代から伝わる、「永遠」を意味する伝統柄"七宝"をベースにしたブランドロゴを冠しています。',
    // インデックス1: プロジェクト2つ目
    '「灯」をメインテーマにした照明ブランド。アウトドア/インドア、日本/世界、道具/工芸品。あらゆる境界線を溶かし、どこに置いても美しく佇む製品を職人と共に創ります。',
    // インデックス2: プロジェクト3つ目
    '企業のブランディングを目的とした、自社商品開発・クラウドファンディング支援・空間演出を初めとした各種プロデュース業務を提供します。',
    // インデックス3: プロジェクト4つ目
    '日本の「ものづくり」を支える企業を対象に経営解決する支援を行っています。業務改善、DX推進、採用支援など、経営課題に応じた支援を行います。'
  ];
}

/**
 * フロントページのプロジェクト投稿IDの順序を保存
 */
add_action('wp', function () {
  if (is_front_page()) {
    // クエリを実行してプロジェクトの投稿IDを取得
    $query_args = [
      'post_type' => 'project',
      'posts_per_page' => 4,
      'order' => 'DESC',
      'orderby' => 'date',
      'post_status' => 'publish',
      'fields' => 'ids', // 投稿IDのみ取得
    ];
    $query = new WP_Query($query_args);
    $GLOBALS['tokimeki_project_ids'] = $query->posts;
    wp_reset_postdata();
  }
}, 1);

/**
 * フロントページのプロジェクト説明文をget_the_excerptで直接置き換え
 * wp_trim_wordsが適用される前に説明文を置き換える
 */
add_filter('get_the_excerpt', function ($excerpt, $post) {
  // フロントページで、project投稿タイプの場合のみ
  if (is_front_page() && isset($post->post_type) && $post->post_type === 'project') {
    // プロジェクト説明文の配列（インデックス0-3に対応）
    $descriptions = [
      // インデックス0: プロジェクト1つ目
      '古くから日本の生活を支えた伝統工芸の技術を礎にしたラグジュアリーライフスタイルブランド。<br>奈良時代から伝わる、「永遠」を意味する伝統柄"七宝"をベースにしたブランドロゴを冠しています。',
      // インデックス1: プロジェクト2つ目
      '「灯」をメインテーマにした照明ブランド。アウトドア/インドア、日本/世界、道具/工芸品。あらゆる境界線を溶かし、どこに置いても美しく佇む製品を職人と共に創ります。',
      // インデックス2: プロジェクト3つ目
      '企業のブランディングを目的とした、自社商品開発・クラウドファンディング支援・空間演出を初めとした各種プロデュース業務を提供します。',
      // インデックス3: プロジェクト4つ目
      '日本の「ものづくり」を支える企業を対象に経営解決する支援を行っています。業務改善、DX推進、採用支援など、経営課題に応じた支援を行います。'
    ];

    // プロジェクト投稿IDの配列から現在の投稿のインデックスを取得
    $project_ids = isset($GLOBALS['tokimeki_project_ids']) ? $GLOBALS['tokimeki_project_ids'] : [];

    // 投稿IDが配列にない場合は、クエリを再実行
    if (empty($project_ids)) {
      $query_args = [
        'post_type' => 'project',
        'posts_per_page' => 4,
        'order' => 'DESC',
        'orderby' => 'date',
        'post_status' => 'publish',
        'fields' => 'ids',
      ];
      $query = new WP_Query($query_args);
      $project_ids = $query->posts;
      $GLOBALS['tokimeki_project_ids'] = $project_ids;
      wp_reset_postdata();
    }

    $current_index = array_search($post->ID, $project_ids);

    // インデックスが見つからない場合は0を使用
    if ($current_index === false) {
      $current_index = 0;
    }

    // インデックスに応じて説明文を取得（0-3の範囲内）
    $index = $current_index % 4;
    $custom_excerpt = isset($descriptions[$index]) ? $descriptions[$index] : '';

    if (!empty($custom_excerpt)) {
      return $custom_excerpt;
    }
  }

  return $excerpt;
}, 1, 2); // 優先度1で早めに実行

/**
 * wp_trim_excerptフィルターで、フロントページのプロジェクト説明文の文字数制限を無効化
 */
add_filter('wp_trim_excerpt', function ($text, $raw_excerpt) {
  if (is_front_page() && !empty($raw_excerpt)) {
    // プロジェクト説明文の配列（インデックス0-3に対応）
    $descriptions = [
      '古くから日本の生活を支えた伝統工芸の技術を礎にしたラグジュアリーライフスタイルブランド。<br>奈良時代から伝わる、「永遠」を意味する伝統柄"七宝"をベースにしたブランドロゴを冠しています。',
      '「灯」をメインテーマにした照明ブランド。アウトドア/インドア、日本/世界、道具/工芸品。あらゆる境界線を溶かし、どこに置いても美しく佇む製品を職人と共に創ります。',
      '企業のブランディングを目的とした、自社商品開発・クラウドファンディング支援・空間演出を初めとした各種プロデュース業務を提供します。',
      '日本の「ものづくり」を支える企業を対象に経営解決する支援を行っています。業務改善、DX推進、採用支援など、経営課題に応じた支援を行います。'
    ];

    // プロジェクト説明文の配列と一致するかチェック
    foreach ($descriptions as $desc) {
      // HTMLタグを除去して比較
      if (strip_tags($text) === strip_tags($desc)) {
        // カスタム説明文の場合は、そのまま返す（文字数制限を適用しない）
        return $desc;
      }
    }
  }
  return $text;
}, 999, 2);

/**
 * post-excerptブロックのレンダリング結果を完全に置き換え
 * フロントページとアーカイブページのプロジェクトの場合、文字数制限を無視して全文を表示
 */
add_filter('render_block_core_post_excerpt', function ($block_content, $block) {
  if (isset($block->context['postId'])) {
    $post_id = $block->context['postId'];
    $post = get_post($post_id);

    if ($post && $post->post_type === 'project') {
      // フロントページの場合：固定の説明文を表示
      if (is_front_page()) {
        // プロジェクト説明文の配列（インデックス0-3に対応）
        $descriptions = [
          // インデックス0: プロジェクト1つ目
          '古くから日本の生活を支えた伝統工芸の技術を礎にしたラグジュアリーライフスタイルブランド。<br>奈良時代から伝わる、「永遠」を意味する伝統柄"七宝"をベースにしたブランドロゴを冠しています。',
          // インデックス1: プロジェクト2つ目
          '「灯」をメインテーマにした照明ブランド。アウトドア/インドア、日本/世界、道具/工芸品。あらゆる境界線を溶かし、どこに置いても美しく佇む製品を職人と共に創ります。',
          // インデックス2: プロジェクト3つ目
          '企業のブランディングを目的とした、自社商品開発・クラウドファンディング支援・空間演出を初めとした各種プロデュース業務を提供します。',
          // インデックス3: プロジェクト4つ目
          '日本の「ものづくり」を支える企業を対象に経営解決する支援を行っています。業務改善、DX推進、採用支援など、経営課題に応じた支援を行います。'
        ];

        // プロジェクト投稿IDの配列から現在の投稿のインデックスを取得
        $project_ids = isset($GLOBALS['tokimeki_project_ids']) ? $GLOBALS['tokimeki_project_ids'] : [];

        // 投稿IDが配列にない場合は、クエリを再実行
        if (empty($project_ids)) {
          $query_args = [
            'post_type' => 'project',
            'posts_per_page' => 4,
            'order' => 'DESC',
            'orderby' => 'date',
            'post_status' => 'publish',
            'fields' => 'ids',
          ];
          $query = new WP_Query($query_args);
          $project_ids = $query->posts;
          $GLOBALS['tokimeki_project_ids'] = $project_ids;
          wp_reset_postdata();
        }

        $current_index = array_search($post_id, $project_ids);

        // インデックスが見つからない場合は0を使用
        if ($current_index === false) {
          $current_index = 0;
        }

        // インデックスに応じて説明文を取得（0-3の範囲内）
        $index = $current_index % 4;
        $custom_excerpt = isset($descriptions[$index]) ? $descriptions[$index] : '';

        error_log('Project excerpt: Index=' . $index . ', PostID=' . $post_id . ', Length=' . strlen($custom_excerpt));

        // カスタム説明文が存在する場合、ブロックの出力を完全に置き換え
        if (!empty($custom_excerpt)) {
          // 既存のブロックラッパーの属性を取得
          preg_match('/<div([^>]*)>/', $block_content, $matches);
          $wrapper_attrs = isset($matches[1]) ? $matches[1] : '';

          // subtitleクラスが含まれていない場合は追加
          if (strpos($wrapper_attrs, 'subtitle') === false) {
            if (preg_match('/class="([^"]*)"/', $wrapper_attrs, $class_matches)) {
              $existing_classes = $class_matches[1];
              $wrapper_attrs = str_replace(
                'class="' . $existing_classes . '"',
                'class="' . $existing_classes . ' subtitle"',
                $wrapper_attrs
              );
            } else {
              $wrapper_attrs .= ' class="subtitle"';
            }
          }

          // カスタム説明文で完全に置き換え（wp_trim_wordsの影響を受けない、全文表示）
          $new_content = sprintf(
            '<div%s><p class="wp-block-post-excerpt__excerpt subtitle">%s</p></div>',
            $wrapper_attrs,
            $custom_excerpt
          );

          return $new_content;
        }
      }
      // アーカイブページの場合：文字数制限を無効化して全文表示
      if (is_post_type_archive('project') || is_archive()) {
        // excerptLength属性を無視して、実際の説明文を全文表示
        // ブロックの属性からexcerptLengthを削除（既にテンプレートで9999に設定済み）
        // wp_trim_wordsが適用されないように、ブロックの出力をそのまま返す
        // ただし、文字数制限がかかっている場合は、get_the_excerptから全文を取得
        $excerpt = get_the_excerpt($post_id);

        // 既存のブロックラッパーの属性を取得
        preg_match('/<div([^>]*)>/', $block_content, $matches);
        $wrapper_attrs = isset($matches[1]) ? $matches[1] : '';

        // subtitleクラスが含まれていない場合は追加
        if (strpos($wrapper_attrs, 'subtitle') === false) {
          if (preg_match('/class="([^"]*)"/', $wrapper_attrs, $class_matches)) {
            $existing_classes = $class_matches[1];
            $wrapper_attrs = str_replace(
              'class="' . $existing_classes . '"',
              'class="' . $existing_classes . ' subtitle"',
              $wrapper_attrs
            );
          } else {
            $wrapper_attrs .= ' class="subtitle"';
          }
        }

        // 全文表示（wp_trim_wordsの影響を受けない）
        $new_content = sprintf(
          '<div%s><p class="wp-block-post-excerpt__excerpt subtitle">%s</p></div>',
          $wrapper_attrs,
          $excerpt
        );

        return $new_content;
      }
    }
  }
  return $block_content;
}, 999, 2); // 高い優先度で最後に実行

/**
 * post-featured-imageブロックのレンダリング結果を置き換え
 * フロントページとアーカイブページのプロジェクト2-4番目のアイコン画像を変更
 */
add_filter('render_block_core_post_featured_image', function ($block_content, $block) {
  if (isset($block->context['postId'])) {
    $post_id = $block->context['postId'];
    $post = get_post($post_id);

    if ($post && $post->post_type === 'project') {
      // プロジェクト画像URLの配列（インデックス0-3に対応）
      // インデックス0（1つ目）は変更なし（null = デフォルトの画像を使用）
      $image_urls = [
        null, // インデックス0: 1つ目（変更なし）
        '/wp-content/uploads/2026/01/銘灯ロゴ__カラー.png', // インデックス1: 2つ目
        '/wp-content/uploads/2026/01/TOKIMEKIコンサル.png', // インデックス2: 3つ目
        '/wp-content/uploads/2026/01/TOKIMEKIデザイン.png'  // インデックス3: 4つ目
      ];

      // プロジェクト投稿IDの配列から現在の投稿のインデックスを取得
      $project_ids = isset($GLOBALS['tokimeki_project_ids']) ? $GLOBALS['tokimeki_project_ids'] : [];

      // 投稿IDが配列にない場合は、クエリを再実行
      if (empty($project_ids)) {
        // フロントページの場合は4件、アーカイブページの場合は100件
        $posts_per_page = is_front_page() ? 4 : 100;
        $query_args = [
          'post_type' => 'project',
          'posts_per_page' => $posts_per_page,
          'order' => 'DESC',
          'orderby' => 'date',
          'post_status' => 'publish',
          'fields' => 'ids',
        ];
        $query = new WP_Query($query_args);
        $project_ids = $query->posts;
        $GLOBALS['tokimeki_project_ids'] = $project_ids;
        wp_reset_postdata();
      }

      $current_index = array_search($post_id, $project_ids);

      // インデックスが見つからない場合は変更なし
      if ($current_index !== false) {
        $index = $current_index % 4;
        $custom_image_url = isset($image_urls[$index]) ? $image_urls[$index] : null;

        // カスタム画像URLが指定されている場合（インデックス1-3）、画像を置き換え
        if ($custom_image_url !== null) {
          // ブロックの属性を取得
          $is_link = isset($block->attributes['isLink']) && $block->attributes['isLink'];
          $link_target = isset($block->attributes['linkTarget']) ? $block->attributes['linkTarget'] : '_self';
          $aspect_ratio = isset($block->attributes['aspectRatio']) ? $block->attributes['aspectRatio'] : '';
          $size_slug = isset($block->attributes['sizeSlug']) ? $block->attributes['sizeSlug'] : 'post-thumbnail';
          $className = isset($block->attributes['className']) ? $block->attributes['className'] : '';

          // 画像のalt属性
          $alt_text = get_the_title($post_id) ?: sprintf(__('Untitled post %d'), $post_id);

          // 画像URLを絶対URLに変換
          $image_url = home_url($custom_image_url);

          // 画像のスタイル属性
          $style_attr = '';
          if ($aspect_ratio) {
            $style_attr = 'width:100%;height:100%;';
          }

          // 画像タグを生成
          $img_tag = sprintf(
            '<img src="%s" alt="%s" class="wp-image-%d" style="%s" />',
            esc_url($image_url),
            esc_attr($alt_text),
            $post_id,
            esc_attr($style_attr)
          );

          // リンクが必要な場合は<a>タグでラップ
          if ($is_link) {
            $permalink = get_permalink($post_id);
            $img_tag = sprintf(
              '<a href="%s" target="%s" rel="noopener">%s</a>',
              esc_url($permalink),
              esc_attr($link_target),
              $img_tag
            );
          }

          // ブロックのラッパー属性を取得
          $wrapper_attrs = '';
          if (preg_match('/<figure([^>]*)>/', $block_content, $matches)) {
            $wrapper_attrs = $matches[1];
          } else {
            // <figure>タグがない場合は、クラス名から生成
            $wrapper_attrs = ' class="wp-block-post-featured-image' . ($className ? ' ' . esc_attr($className) : '') . '"';
          }

          // 新しいコンテンツを生成
          $new_content = '<figure' . $wrapper_attrs . '>' . $img_tag . '</figure>';

          return $new_content;
        }
      }
    }
  }
  return $block_content;
}, 999, 2); // 高い優先度で最後に実行

/**
 * プロジェクトタイトルをフィルター
 * 2つ目のプロジェクトタイトルにクラスを追加してJavaScriptで処理できるようにする
 */
add_filter('render_block_core_post_title', function ($block_content, $block) {
  if (isset($block->context['postId'])) {
    $post_id = $block->context['postId'];
    $post = get_post($post_id);

    if ($post && $post->post_type === 'project') {
      // プロジェクト投稿IDの配列から現在の投稿のインデックスを取得
      $project_ids = isset($GLOBALS['tokimeki_project_ids']) ? $GLOBALS['tokimeki_project_ids'] : [];

      if (empty($project_ids)) {
        $query_args = [
          'post_type' => 'project',
          'posts_per_page' => 100,
          'order' => 'DESC',
          'orderby' => 'date',
          'post_status' => 'publish',
          'fields' => 'ids',
        ];
        $query = new WP_Query($query_args);
        $project_ids = $query->posts;
        $GLOBALS['tokimeki_project_ids'] = $project_ids;
        wp_reset_postdata();
      }

      $current_index = array_search($post_id, $project_ids);

      // 2つ目のプロジェクト（インデックス1）の場合、クラスを追加
      if ($current_index === 1) {
        // タイトルにクラスを追加
        $block_content = preg_replace('/(<h[1-6][^>]*class="[^"]*)/', '$1 project-title-second', $block_content);
      }
    }
  }
  return $block_content;
}, 10, 2);
