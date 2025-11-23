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
    
    // bodyに直接追加（画面全体に表示するため）
    document.body.appendChild(canvasContainer);

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let circles = [];
    let phase = 'multiply'; // multiply -> reveal -> fadeout
    let startTime = null;
    let fadeoutStartTime = null;
    
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

    // Canvasサイズを設定
    function resizeCanvas() {
      // 画面全体のサイズを使用（ロゴ以外の「O」が画面全体に広がるように）
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // デバッグ情報
      console.log('=== Canvas サイズ ===');
      console.log('Canvas width:', canvas.width);
      console.log('Canvas height:', canvas.height);
      console.log('Window innerWidth:', window.innerWidth);
      console.log('Window innerHeight:', window.innerHeight);
      console.log('heroSection width:', heroSection.getBoundingClientRect().width);
      console.log('heroSection height:', heroSection.getBoundingClientRect().height);
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
      const centerX = heroRect.left + heroRect.width / 2;
      const centerY = heroRect.top + heroRect.height / 2;
      
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
      
      // デバッグ情報
      console.log('=== ロゴ配置情報 ===');
      console.log('ロゴ全体サイズ: 横520単位 / 縦444単位');
      console.log('ロゴ全体縦横比:', (520/444).toFixed(4));
      console.log('Canvas centerX:', scaleInfo.centerX);
      console.log('Canvas centerY:', scaleInfo.centerY);
      console.log('Scale:', scaleInfo.scale);
      console.log('O縦横比: 横半径', scaleInfo.horizontalRadius, 'px / 縦半径', scaleInfo.verticalRadius, 'px');
      console.log('O縦横比比率:', (scaleInfo.horizontalRadius / scaleInfo.verticalRadius).toFixed(4), '(65/74 =', (65/74).toFixed(4), ')');
      
      const circles = logoPattern.map(pattern => {
        const x = scaleInfo.centerX + pattern.x * scaleInfo.scale;
        const y = scaleInfo.centerY - pattern.y * scaleInfo.scale;
        
        // 3段目の中央（id: 7, 8）の位置を確認
        if (pattern.x === 65 || pattern.x === -65) {
          console.log(`Circle id ${pattern.x === 65 ? 7 : 8}: x=${x}, y=${y}, pattern.x=${pattern.x}`);
        }
        
        // ロゴからの距離を計算（フェードアウトの順序に使用）
        const distanceFromCenter = Math.abs(pattern.x);
        
        return {
          // Canvas座標系: ロゴの中心（x: 0）がCanvasの中心に来るように配置
          // yは反転（上から下が正）
          x: x,
          y: y,
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
      else if (phase === 'multiply' && elapsed >= 4 && elapsed < 5) {
        phase = 'reveal';
        // すべての「O」を完全に表示
        circles.forEach(circle => {
          circle.opacity = circle.targetOpacity;
        });
      }
      // フェーズ3: ロゴ以外をフェードアウト（5-7秒）- 距離に基づいて順序付け
      else if (phase === 'reveal' && elapsed >= 5) {
        phase = 'fadeout';
        // フェードアウト開始時刻を記録
        if (fadeoutStartTime === null) {
          fadeoutStartTime = elapsed;
        }
      }
      
      if (phase === 'fadeout') {
        const fadeoutElapsed = elapsed - fadeoutStartTime;
        const fadeoutDuration = 2; // フェードアウトの期間（2秒）
        
        // ロゴ以外の「O」の最大距離を計算
        const nonLogoCircles = circles.filter(c => !c.keep);
        const maxDistance = nonLogoCircles.length > 0 
          ? Math.max(...nonLogoCircles.map(c => c.distanceFromCenter || 0))
          : 1;
        
        circles.forEach(circle => {
          if (!circle.keep) {
            // ロゴからの距離に基づいてフェードアウトの開始タイミングを決定
            // 距離が遠いほど早くフェードアウト開始
            const distanceRatio = maxDistance > 0 ? (circle.distanceFromCenter || 0) / maxDistance : 0;
            const fadeoutDelay = distanceRatio * fadeoutDuration * 0.3; // 最大でフェードアウト期間の30%まで遅延
            
            if (fadeoutElapsed >= fadeoutDelay) {
              const fadeoutProgress = Math.min((fadeoutElapsed - fadeoutDelay) / (fadeoutDuration - fadeoutDelay), 1);
              circle.opacity = Math.max(circle.targetOpacity * (1 - fadeoutProgress), 0);
            }
          } else {
            // ロゴの「O」は完全に表示を維持
            circle.opacity = circle.targetOpacity;
          }
        });
        
        // フェードアウト完了後、ロゴのみを残す
        if (fadeoutElapsed > fadeoutDuration) {
          circles = circles.filter(c => c.keep);
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
            ctx.lineWidth = 2;
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
            ctx.lineWidth = 2;
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

