(function(){
  'use strict';

  // ヒーローアニメーション初期化
  function initHeroAnimation() {
    const heroSection = document.querySelector('.sec-hero');
    if (!heroSection) return;

    const coverBlock = heroSection.querySelector('.wp-block-cover');
    if (!coverBlock) return;

    // アニメーション用のCanvasコンテナを作成
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'hero-logo-animation';
    // CSSでposition: fixedが設定されているので、インラインスタイルは最小限に
    canvasContainer.style.cssText = 'pointer-events:none;';
    
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-animation-canvas';
    canvasContainer.appendChild(canvas);
    
    // heroSectionに追加（スクロール時に一緒に動くように）
    heroSection.style.position = 'relative';
    heroSection.insertBefore(canvasContainer, heroSection.firstChild);

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let circles = [];
    let phase = 'multiply'; // multiply -> reveal -> fadeout -> showImage
    let startTime = null;
    let fadeoutStartTime = null;
    let imageShowStartTime = null;
    let logoImage = null;
    let imageOpacity = 0;
    
    // 「O」の縦横比（固定値）
    // 横半径65:縦半径74
    const O_HORIZONTAL_RADIUS = 65;
    const O_VERTICAL_RADIUS = 74;
    const O_ASPECT_RATIO = O_HORIZONTAL_RADIUS / O_VERTICAL_RADIUS; // 約0.8784
    
    // ロゴの「O」の配置（14個、5行構成）
    // 座標系: 横半径65、縦半径74を基準とした座標
    // 1段目: (65,148)(-65,148)
    // 2段目: (130,74)(0,74)(-130,74)
    // 3段目: (195,0)(65,0)(-65,0)(-195,0)
    // 4段目: (130,-74)(0,-74)(-130,-74)
    // 5段目: (65,-148)(-65,-148)
    const logoPattern = [
      // 1段目 (2個)
      {x: 65, y: 148, keep: true},   // id: 1
      {x: -65, y: 148, keep: true},  // id: 2
      
      // 2段目 (3個)
      {x: 130, y: 74, keep: true},   // id: 3
      {x: 0, y: 74, keep: true},     // id: 4
      {x: -130, y: 74, keep: true}, // id: 5
      
      // 3段目 (4個)
      {x: 195, y: 0, keep: true},    // id: 6
      {x: 65, y: 0, keep: true},     // id: 7
      {x: -65, y: 0, keep: true},    // id: 8
      {x: -195, y: 0, keep: true},   // id: 9
      
      // 4段目 (3個)
      {x: 130, y: -74, keep: true},  // id: 10
      {x: 0, y: -74, keep: true},    // id: 11
      {x: -130, y: -74, keep: true}, // id: 12
      
      // 5段目 (2個)
      {x: 65, y: -148, keep: true},  // id: 13
      {x: -65, y: -148, keep: true}, // id: 14
    ];

    // 画像を読み込む
    function loadLogoImage() {
      logoImage = new Image();
      
      // WordPressのサイトURLを取得（パスを含む）
      const currentPath = window.location.pathname;
      let basePath = '';
      // /tokimeki/のようなサブディレクトリがある場合を検出
      if (currentPath.includes('/tokimeki/')) {
        basePath = '/tokimeki';
      }
      
      const siteUrl = window.location.origin + basePath;
      // ファイル名をURLエンコード
      const fileName = encodeURIComponent('2のコピー.png');
      
      let retryCount = 0;
      const maxRetries = 3;
      let hasLoggedError = false;
      
      function tryLoadImage(src, attempt) {
        logoImage.src = src;
      }
      
      logoImage.onload = function() {
        retryCount = 0; // 成功したらリセット
      };
      
      logoImage.onerror = function() {
        retryCount++;
        
        if (retryCount === 1) {
          // フォールバック1: 相対パスで再試行（エンコードあり）
          tryLoadImage(basePath + '/wp-content/uploads/2025/11/' + fileName, retryCount);
        } else if (retryCount === 2) {
          // フォールバック2: エンコードなしで再試行
          tryLoadImage(siteUrl + '/wp-content/uploads/2025/11/2のコピー.png', retryCount);
        } else if (retryCount === 3) {
          // フォールバック3: 相対パス（エンコードなし）
          tryLoadImage(basePath + '/wp-content/uploads/2025/11/2のコピー.png', retryCount);
        } else {
          if (retryCount === maxRetries + 1) {
            logoImage = null; // 画像読み込み失敗をマーク
          }
        }
      };
      
      // 最初の試行
      tryLoadImage(siteUrl + '/wp-content/uploads/2025/11/' + fileName, 0);
    }

    // 画像を読み込み開始
    loadLogoImage();

    // Canvasサイズを設定
    function resizeCanvas() {
      // 画面全体のサイズを使用（ロゴ以外の「O」が画面全体に広がるように）
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // スケール計算を共有する関数
    function getScale() {
      const logoCenterWidth = 390;
      const logoCenterHeight = 296;
      const logoFullWidth = logoCenterWidth + O_HORIZONTAL_RADIUS * 2; // 520単位
      const logoFullHeight = logoCenterHeight + O_VERTICAL_RADIUS * 2; // 444単位
      
      const padding = 60;
      const availableWidth = canvas.width - padding * 2;
      const availableHeight = canvas.height - padding * 2;
      
      const scaleX = availableWidth / logoFullWidth;
      const scaleY = availableHeight / logoFullHeight;
      const scale = Math.min(scaleX, scaleY) * 1.105 * 0.75; // 25%小さく（0.75倍）
      
      // heroSectionの中央を計算（ロゴはheroSectionの中央に配置）
      const heroRect = heroSection.getBoundingClientRect();
      // Canvasは画面全体なので、heroSectionの中央をCanvas座標系に変換
      const centerX = heroRect.left + heroRect.width / 2;
      const centerY = heroRect.top + heroRect.height / 2 - 110; // 110px上に移動（30px追加）
      
      return {
        scale: scale,
        verticalRadius: O_VERTICAL_RADIUS * scale,
        horizontalRadius: O_HORIZONTAL_RADIUS * scale,
        centerX: centerX,
        centerY: centerY
      };
    }

    // 規則性のある「O」を生成（ロゴの左右に配置、画面全体を覆う）
    function createPatternCircles() {
      const scaleInfo = getScale();
      const circles = [];
      const unitSpacing = 130; // ロゴの「O」間の間隔（130単位）
      
      // 各段のロゴ範囲とy座標
      const rows = [
        {y: 148, leftEdge: -65, rightEdge: 65},   // 1段目
        {y: 74, leftEdge: -130, rightEdge: 130},  // 2段目
        {y: 0, leftEdge: -195, rightEdge: 195},   // 3段目
        {y: -74, leftEdge: -130, rightEdge: 130}, // 4段目
        {y: -148, leftEdge: -65, rightEdge: 65},  // 5段目
      ];
      
      // Canvasのサイズから、画面全体を覆うために必要な「O」の数を計算
      // 画面全体（100vw）をカバーするために必要な数
      const canvasWidthInUnits = canvas.width / scaleInfo.scale;
      const rightCount = Math.ceil((canvasWidthInUnits / 2 - 195) / unitSpacing) + 10; // 余裕を持たせる
      const leftCount = Math.ceil((canvasWidthInUnits / 2 - 195) / unitSpacing) + 10;
      
      // 各段でロゴの左右に規則的に配置（画面全体を覆う）
      rows.forEach(row => {
        // 右側に配置（ロゴの右端から130単位ずつ、画面端まで）
        for (let i = 1; i <= rightCount; i++) {
          const patternX = row.rightEdge + unitSpacing * i;
          const x = scaleInfo.centerX + patternX * scaleInfo.scale;
          const y = scaleInfo.centerY - row.y * scaleInfo.scale;
          
          // 画面範囲内かチェック（Canvas範囲外でも表示可能にするため、緩いチェック）
          if (x + scaleInfo.horizontalRadius > -100 && x - scaleInfo.horizontalRadius < canvas.width + 100) {
            // ロゴからの距離を計算（フェードアウトの順序に使用）
            const distanceFromCenter = Math.abs(patternX);
            
            circles.push({
              x: x,
              y: y,
              horizontalRadius: scaleInfo.horizontalRadius,
              verticalRadius: scaleInfo.verticalRadius,
              opacity: 0,
              targetOpacity: 0.3 + Math.random() * 0.4,
              speed: 0.005 + Math.random() * 0.01, // フェードイン速度を遅く
              isLogo: false,
              keep: false,
              delay: Math.random() * 4, // フェードインの遅延を長く（0-4秒）
              distanceFromCenter: distanceFromCenter // ロゴからの距離
            });
          }
        }
        
        // 左側に配置（ロゴの左端から130単位ずつ、画面端まで）
        for (let i = 1; i <= leftCount; i++) {
          const patternX = row.leftEdge - unitSpacing * i;
          const x = scaleInfo.centerX + patternX * scaleInfo.scale;
          const y = scaleInfo.centerY - row.y * scaleInfo.scale;
          
          // 画面範囲内かチェック（Canvas範囲外でも表示可能にするため、緩いチェック）
          if (x + scaleInfo.horizontalRadius > -100 && x - scaleInfo.horizontalRadius < canvas.width + 100) {
            // ロゴからの距離を計算（フェードアウトの順序に使用）
            const distanceFromCenter = Math.abs(patternX);
            
            circles.push({
              x: x,
              y: y,
              horizontalRadius: scaleInfo.horizontalRadius,
              verticalRadius: scaleInfo.verticalRadius,
              opacity: 0,
              targetOpacity: 0.3 + Math.random() * 0.4,
              speed: 0.005 + Math.random() * 0.01, // フェードイン速度を遅く
              isLogo: false,
              keep: false,
              delay: Math.random() * 4, // フェードインの遅延を長く（0-4秒）
              distanceFromCenter: distanceFromCenter // ロゴからの距離
            });
          }
        }
      });
      
      return circles;
    }

    // ロゴパターンの「O」を生成
    function createLogoCircles() {
      const scaleInfo = getScale();
      
      const circles = logoPattern.map(pattern => {
        const x = scaleInfo.centerX + pattern.x * scaleInfo.scale;
        const y = scaleInfo.centerY - pattern.y * scaleInfo.scale;
        
        // ロゴからの距離を計算（フェードアウトの順序に使用）
        const distanceFromCenter = Math.abs(pattern.x);
        
        return {
          // Canvas座標系: ロゴの中心（x: 0）がCanvasの中心に来るように配置
          // yは反転（上から下が正）
          x: x,
          y: y,
          initialX: x, // 初期X座標（中心への移動に使用）
          initialY: y, // 初期Y座標（中心への移動に使用）
          horizontalRadius: scaleInfo.horizontalRadius, // 横半径
          verticalRadius: scaleInfo.verticalRadius,     // 縦半径
          opacity: 0,
          targetOpacity: 1,
          speed: 0.01, // フェードイン速度を遅く
          isLogo: true,
          keep: pattern.keep,
          delay: Math.random() * 3, // ロゴも段階的にフェードイン（0-3秒）
          distanceFromCenter: distanceFromCenter // ロゴからの距離（ロゴ内では0に近い）
        };
      });
      
      return circles;
    }

    // アニメーションループ
    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = (currentTime - startTime) / 1000; // 秒

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // フェーズ1: 増殖（0-4秒）- すべての「O」を段階的にフェードイン
      if (phase === 'multiply' && elapsed < 4) {
        // 最初にすべての「O」（規則性のある「O」とロゴ）を生成
        if (circles.length === 0) {
          const patternCircles = createPatternCircles();
          const logoCircles = createLogoCircles();
          circles.push(...patternCircles);
          circles.push(...logoCircles);
        }
        
        // すべての「O」を段階的にフェードイン（delayに基づいて）
        circles.forEach(circle => {
          // delayが経過したらフェードイン開始
          if (elapsed >= circle.delay) {
            circle.opacity = Math.min(
              circle.opacity + circle.speed, 
              circle.targetOpacity
            );
          }
        });
      }
      // フェーズ2: すべて表示完了（4-5秒）
      else if (phase === 'multiply' && elapsed >= 5 && elapsed < 6) {
        phase = 'reveal';
        // すべての「O」を完全に表示
        circles.forEach(circle => {
          circle.opacity = circle.targetOpacity;
        });
      }
      // フェーズ3: 全てのOをフェードアウト（5-7秒）- 距離に基づいて順序付け
      else if (phase === 'reveal' && elapsed >= 5) {
        phase = 'fadeout';
        // フェードアウト開始時刻を記録
        if (fadeoutStartTime === null) {
          fadeoutStartTime = elapsed;
        }
      }
      
      if (phase === 'fadeout') {
        const fadeoutElapsed = elapsed - fadeoutStartTime;
        const fadeoutDuration = 2; // 全てのOのフェードアウト期間（2秒）
        
        // 全ての「O」の最大距離を計算（14個のOも含む）
        const maxDistance = circles.length > 0 
          ? Math.max(...circles.map(c => c.distanceFromCenter || 0))
          : 1;
        
        circles.forEach(circle => {
          // 全てのO（14個のOも含む）を距離に基づいてフェードアウト
          const distanceRatio = maxDistance > 0 ? (circle.distanceFromCenter || 0) / maxDistance : 0;
          const fadeoutDelay = distanceRatio * fadeoutDuration * 0.3; // 最大でフェードアウト期間の30%まで遅延
          
          if (fadeoutElapsed >= fadeoutDelay) {
            const fadeoutProgress = Math.min((fadeoutElapsed - fadeoutDelay) / (fadeoutDuration - fadeoutDelay), 1);
            circle.opacity = Math.max(circle.targetOpacity * (1 - fadeoutProgress), 0);
          }
        });
        
        // 画像をフェードイン（全てのOのフェードアウト完了後）
        const imageFadeinStartDelay = fadeoutDuration; // 全てのOのフェードアウト完了時点
        if (fadeoutElapsed >= imageFadeinStartDelay) {
          if (imageShowStartTime === null) {
            imageShowStartTime = elapsed;
          }
          
          const imageElapsed = elapsed - imageShowStartTime;
          const imageFadeDuration = 3; // 画像のフェードイン期間（3秒）- より早く完全表示
          if (imageElapsed <= imageFadeDuration) {
            imageOpacity = Math.min(imageElapsed / imageFadeDuration, 1);
          } else {
            imageOpacity = 1;
          }
        }
        
        // フェードアウト完了後、すべてのOを削除
        if (fadeoutElapsed > fadeoutDuration) {
          circles = circles.filter(c => false); // すべてのOを削除
          phase = 'showImage'; // 画像表示フェーズに移行
        }
      }

      // フェーズ4: 画像表示（フェードアウト完了後）
      if (phase === 'showImage') {
        // 画像のフェードイン処理を継続
        if (imageShowStartTime !== null) {
          const imageElapsed = elapsed - imageShowStartTime;
          const imageFadeDuration = 2; // 画像のフェードイン期間（1秒）- より早く完全表示
          if (imageElapsed <= imageFadeDuration) {
            imageOpacity = Math.min(imageElapsed / imageFadeDuration, 1);
          } else {
            imageOpacity = 1;
          }
        } else {
          // imageShowStartTimeが設定されていない場合は完全に表示
          imageOpacity = 1;
        }
      }

      // 「O」を描画
      circles.forEach(circle => {
        if (circle.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = circle.opacity;
          
          if (circle.isLogo) {
            // ロゴの「O」は楕円として描画（横半径65:縦半径74）
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 5; // 2.5倍（2 * 2.5 = 5）
            ctx.beginPath();
            // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
            ctx.ellipse(
              circle.x, 
              circle.y, 
              circle.horizontalRadius, 
              circle.verticalRadius, 
              0, 
              0, 
              Math.PI * 2
            );
            ctx.stroke();
          } else {
            // 規則性のある「O」はロゴと同じ楕円として描画
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 5; // 2.5倍（2 * 2.5 = 5）
            ctx.beginPath();
            ctx.ellipse(
              circle.x, 
              circle.y, 
              circle.horizontalRadius, 
              circle.verticalRadius, 
              0, 
              0, 
              Math.PI * 2
            );
            ctx.stroke();
          }
          
          ctx.restore();
        }
      });

      // 画像を描画（fadeoutフェーズとshowImageフェーズで）
      if ((phase === 'fadeout' || phase === 'showImage') && logoImage && logoImage.complete && imageOpacity > 0) {
        const scaleInfo = getScale();
        const imageWidth = logoImage.width;
        const imageHeight = logoImage.height;
        
        if (imageWidth > 0 && imageHeight > 0) {
          const imageAspectRatio = imageWidth / imageHeight;
          
          // 画像を中央に配置し、適切なサイズで表示
          const maxWidth = canvas.width * 0.6; // 画面幅の60%
          const maxHeight = canvas.height * 0.6; // 画面高さの60%
          
          let drawWidth = maxWidth;
          let drawHeight = maxWidth / imageAspectRatio;
          
          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = maxHeight * imageAspectRatio;
          }
          
          const imageX = scaleInfo.centerX - drawWidth / 2;
          const imageY = scaleInfo.centerY - drawHeight / 2;
          
          ctx.save();
          ctx.globalAlpha = imageOpacity;
          ctx.drawImage(logoImage, imageX, imageY, drawWidth, drawHeight);
          ctx.restore();
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    // リサイズハンドラ
    function handleResize() {
      resizeCanvas();
      // ロゴと規則性のある「O」の位置とサイズを再計算
      if (phase !== 'multiply') {
        const logoCircles = createLogoCircles();
        const patternCircles = createPatternCircles();
        
        // ロゴの「O」を更新
        circles.forEach((circle, index) => {
          if (circle.isLogo && logoCircles[index]) {
            circle.x = logoCircles[index].x;
            circle.y = logoCircles[index].y;
            circle.horizontalRadius = logoCircles[index].horizontalRadius;
            circle.verticalRadius = logoCircles[index].verticalRadius;
          }
        });
        
        // 規則性のある「O」を更新
        let patternIndex = 0;
        circles.forEach((circle) => {
          if (!circle.isLogo && patternCircles[patternIndex]) {
            circle.x = patternCircles[patternIndex].x;
            circle.y = patternCircles[patternIndex].y;
            circle.horizontalRadius = patternCircles[patternIndex].horizontalRadius;
            circle.verticalRadius = patternCircles[patternIndex].verticalRadius;
            patternIndex++;
          }
        });
      } else {
        // multiplyフェーズ中は、規則性のある「O」を再生成
        const patternCircles = createPatternCircles();
        circles = circles.filter(c => c.isLogo); // ロゴ以外を削除
        circles.push(...patternCircles); // 新しい規則性のある「O」を追加
      }
    }

    // 初期化
    resizeCanvas();
    window.addEventListener('resize', handleResize);
    animationId = requestAnimationFrame(animate);

    // クリーンアップ関数（必要に応じて）
    return function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }

  // DOMContentLoadedで実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroAnimation);
  } else {
    initHeroAnimation();
  }
})();

