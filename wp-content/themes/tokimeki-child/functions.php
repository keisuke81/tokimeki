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
