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
      let scale = Math.min(scaleX, scaleY) * 1.105 * 0.75; // 25%小さく（0.75倍）
      
      // デバイス判定
      const isMobile = window.innerWidth <= 640;
      const isTablet = !isMobile && window.innerWidth <= 1024;
      const isPC = !isMobile && !isTablet;
      
      // PCとタブレットの時は、Oのサイズを20%小さく（0.8倍）
      if (!isMobile) {
        scale = scale * 0.8; // 20%小さく
      }
      
      // タブレットの時は、さらに5%小さく（0.85倍）
      if (isTablet) {
        scale = scale * 0.85; // さらに5%小さく
      }
      
      // PCの時は、さらに10%小さく（0.9倍）
      if (isPC) {
        scale = scale * 0.8; // さらに10%小さく
      }
      
      // heroSectionの中央を計算（ロゴはheroSectionの中央に配置）
      const heroRect = heroSection.getBoundingClientRect();
      // Canvasは画面全体なので、heroSectionの中央をCanvas座標系に変換
      const centerX = heroRect.left + heroRect.width / 2;
      
      // デバイス別のY位置調整
      let centerY;
      if (isMobile) {
        // スマホ: 110px上に移動
        centerY = heroRect.top + heroRect.height / 2 - 110;
      } else if (window.innerWidth <= 1024) {
        // タブレット: 画像の位置と合わせるため、さらに上に移動（180px上）
        centerY = heroRect.top + heroRect.height / 2 - 220;
      } else {
        // PC: 画像の位置と合わせるため、さらに上に移動（150px上）
        centerY = heroRect.top + heroRect.height / 2 - 180;
      }
      
      // 画像の位置を独立して計算（Oの位置とは別）
      let imageCenterY;
      if (isMobile) {
        // スマホ: 110px上に移動
        imageCenterY = heroRect.top + heroRect.height / 2 - 110;
      } else if (window.innerWidth <= 1024) {
        // タブレット: 画像の位置（170px上、Oの位置変更の影響を受けない）
        imageCenterY = heroRect.top + heroRect.height / 2 - 170;
      } else {
        // PC: 画像の位置（150px上）
        imageCenterY = heroRect.top + heroRect.height / 2 - 105;
      }
      
      return {
        scale: scale,
        verticalRadius: O_VERTICAL_RADIUS * scale,
        horizontalRadius: O_HORIZONTAL_RADIUS * scale,
        centerX: centerX,
        centerY: centerY, // Oの位置
        imageCenterY: imageCenterY, // 画像の位置（独立）
        isMobile: isMobile, // デバイス判定を返す
        isTablet: isTablet, // タブレット判定を返す
        isPC: isPC // PC判定を返す
      };
    }

    // 規則性のある「O」を生成（ロゴの左右に配置、画面全体を覆う）
    function createPatternCircles() {
      const scaleInfo = getScale();
      const circles = [];
      const unitSpacing = 130; // ロゴの「O」間の間隔（130単位）
      const verticalSpacing = 74; // 縦方向の間隔（74単位）
      
      // スマホサイズかどうかを判定（画面の幅が640px以下）
      const isMobile = window.innerWidth <= 640;
      
      // 各段のロゴ範囲とy座標（基本の5段）
      const rows = [
        {y: 148, leftEdge: -65, rightEdge: 65},   // 1段目
        {y: 74, leftEdge: -130, rightEdge: 130},  // 2段目
        {y: 0, leftEdge: -195, rightEdge: 195},   // 3段目
        {y: -74, leftEdge: -130, rightEdge: 130}, // 4段目
        {y: -148, leftEdge: -65, rightEdge: 65},  // 5段目
      ];
      
      // スマホサイズの時は、上下に5段ずつ追加して15段にする（各段でrightCount/leftCountに基づいてOが生成される）
      if (isMobile) {
        // 上方向に5段追加（1段目の上、74単位間隔で規則的に配置）
        for (let i = 1; i <= 2; i++) {
          rows.unshift({
            y: 148 + verticalSpacing * i,
            leftEdge: -65,
            rightEdge: 65
          });
        }
        
        // 下方向に5段追加（5段目の下、74単位間隔で規則的に配置）
        for (let i = 1; i <= 2; i++) {
          rows.push({
            y: -148 - verticalSpacing * i,
            leftEdge: -65,
            rightEdge: 65
          });
        }
      }
      
      // Canvasのサイズから、画面全体を覆うために必要な「O」の数を計算
      // 画面全体（100vw）をカバーするために必要な数
      const canvasWidthInUnits = canvas.width / scaleInfo.scale;
      const maxCount = Math.ceil(canvasWidthInUnits / 2 / unitSpacing) + 10; // 余裕を持たせる
      
      // 各段で中心から左右に規則的に配置（画面全体を覆う）
      rows.forEach(row => {
        // 中心（0）から右方向に配置（130単位ずつ）
        for (let i = 0; i <= maxCount; i++) {
          const patternX = unitSpacing * i; // 0, 130, 260, 390, ...
          const x = scaleInfo.centerX + patternX * scaleInfo.scale;
          const y = scaleInfo.centerY - row.y * scaleInfo.scale;
          
          // 画面範囲内かチェック（Canvas範囲外でも表示可能にするため、緩いチェック）
          if (x + scaleInfo.horizontalRadius > -100 && x - scaleInfo.horizontalRadius < canvas.width + 100) {
            // 中心からの距離を計算（フェードアウトの順序に使用）
            const distanceFromCenter = Math.abs(patternX);
            
            circles.push({
              x: x,
              y: y,
              horizontalRadius: scaleInfo.horizontalRadius,
              verticalRadius: scaleInfo.verticalRadius,
              opacity: 0,
              targetOpacity: 0.3 + Math.random() * 0.4,
              speed: 0.003 + Math.random() * 0.015, // フェードイン速度をより多様に（0.003-0.018）
              isLogo: false,
              keep: false,
              delay: Math.random() * 5, // フェードインの遅延をより広く（0-5秒）
              distanceFromCenter: distanceFromCenter, // 中心からの距離
              fadeoutDelay: Math.random() * 1.5 // フェードアウトの開始遅延をランダムに（0-1.5秒）
            });
          }
        }
        
        // 中心（0）から左方向に配置（130単位ずつ）
        for (let i = 1; i <= maxCount; i++) {
          const patternX = -unitSpacing * i; // -130, -260, -390, ...
          const x = scaleInfo.centerX + patternX * scaleInfo.scale;
          const y = scaleInfo.centerY - row.y * scaleInfo.scale;
          
          // 画面範囲内かチェック（Canvas範囲外でも表示可能にするため、緩いチェック）
          if (x + scaleInfo.horizontalRadius > -100 && x - scaleInfo.horizontalRadius < canvas.width + 100) {
            // 中心からの距離を計算（フェードアウトの順序に使用）
            const distanceFromCenter = Math.abs(patternX);
            
            circles.push({
              x: x,
              y: y,
              horizontalRadius: scaleInfo.horizontalRadius,
              verticalRadius: scaleInfo.verticalRadius,
              opacity: 0,
              targetOpacity: 0.3 + Math.random() * 0.4,
              speed: 0.003 + Math.random() * 0.015, // フェードイン速度をより多様に（0.003-0.018）
              isLogo: false,
              keep: false,
              delay: Math.random() * 5, // フェードインの遅延をより広く（0-5秒）
              distanceFromCenter: distanceFromCenter, // 中心からの距離
              fadeoutDelay: Math.random() * 1.5 // フェードアウトの開始遅延をランダムに（0-1.5秒）
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

      // フェーズ1: 増殖（0秒以降）- すべての「O」を段階的にフェードイン
      if (phase === 'multiply') {
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
      
      // フェーズ2: フェードイン継続中にフェードアウト開始（3秒以降）- フェードインとフェードアウトが同時進行
      if (elapsed >= 3 && phase === 'multiply') {
        phase = 'fadeout';
        // フェードアウト開始時刻を記録
        if (fadeoutStartTime === null) {
          fadeoutStartTime = elapsed;
          // フェードアウト開始時に、各circleのフェードアウト遅延と速度を確定
          const maxDistance = circles.length > 0 
            ? Math.max(...circles.map(c => c.distanceFromCenter || 0))
            : 1;
          circles.forEach(circle => {
            // フェードアウト遅延を確定（ランダム要素 + 距離要素）
            const distanceRatio = maxDistance > 0 ? (circle.distanceFromCenter || 0) / maxDistance : 0;
            const randomDelay = circle.fadeoutDelay || Math.random() * 1.5;
            const distanceDelay = distanceRatio * 0.5; // 距離による遅延を小さく
            circle.fadeoutDelayFinal = randomDelay + distanceDelay;
            // フェードアウト速度を確定（0.8-1.2倍）
            circle.fadeoutSpeed = 0.8 + Math.random() * 0.4;
          });
        }
      }
      
      if (phase === 'fadeout') {
        const fadeoutElapsed = elapsed - fadeoutStartTime;
        const fadeoutDuration = 2.5; // 全てのOのフェードアウト期間（2.5秒）
        
        circles.forEach(circle => {
          // フェードイン処理（まだdelayに達していないOや、フェードイン中のO）
          let fadeInOpacity = circle.opacity;
          if (elapsed >= circle.delay && fadeInOpacity < circle.targetOpacity) {
            fadeInOpacity = Math.min(
              fadeInOpacity + circle.speed, 
              circle.targetOpacity
            );
          }
          
          // フェードアウト処理
          const fadeoutDelay = circle.fadeoutDelayFinal || 0;
          let finalOpacity = fadeInOpacity;
          
          if (fadeoutElapsed >= fadeoutDelay) {
            const fadeoutProgress = Math.min((fadeoutElapsed - fadeoutDelay) / (fadeoutDuration - fadeoutDelay), 1);
            const fadeoutSpeed = circle.fadeoutSpeed || 1.0;
            // フェードインで到達したopacityからフェードアウト
            finalOpacity = Math.max(fadeInOpacity * (1 - fadeoutProgress * fadeoutSpeed), 0);
          }
          
          // 最終的なopacityを設定
          circle.opacity = finalOpacity;
        });
        
        // 画像をフェードイン（Oのフェードアウトの後半から開始 - フェードアウトと同時進行）
        const imageFadeinStartDelay = fadeoutDuration * 0.4; // フェードアウト期間の40%経過時点から開始
        if (fadeoutElapsed >= imageFadeinStartDelay) {
          if (imageShowStartTime === null) {
            imageShowStartTime = elapsed;
          }
          
          const imageElapsed = elapsed - imageShowStartTime;
          const imageFadeDuration = 3; // 画像のフェードイン期間（3秒）
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
      const scaleInfo = getScale();
      // デバイス別のフォントウェイト設定
      let lineWidth;
      if (scaleInfo.isMobile) {
        lineWidth = 5; // スマホ
      } else if (scaleInfo.isTablet) {
        lineWidth = 10; // タブレット
      } else {
        lineWidth = 9; // PC
      }
      
      circles.forEach(circle => {
        if (circle.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = circle.opacity;
          
          if (circle.isLogo) {
            // ロゴの「O」は楕円として描画（横半径65:縦半径74）
            ctx.strokeStyle = '#000';
            ctx.lineWidth = lineWidth;
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
            ctx.lineWidth = lineWidth;
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
          // PCの時は5%大きく（1.05倍）
          const sizeMultiplier = scaleInfo.isPC ? 1.05 : 1.0;
          const maxWidth = canvas.width * 0.6 * sizeMultiplier; // 画面幅の60%（PCの時は5%大きく）
          const maxHeight = canvas.height * 0.6 * sizeMultiplier; // 画面高さの60%（PCの時は5%大きく）
          
          let drawWidth = maxWidth;
          let drawHeight = maxWidth / imageAspectRatio;
          
          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = maxHeight * imageAspectRatio;
          }
          
          const imageX = scaleInfo.centerX - drawWidth / 2;
          // タブレットの時は画像の位置を48px下に下げる
          const imageYOffset = scaleInfo.isTablet ? 48 : 0;
          // 画像の位置は独立したimageCenterYを使用
          const imageY = scaleInfo.imageCenterY - drawHeight / 2 + imageYOffset;
          
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

