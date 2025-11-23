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
    canvasContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-animation-canvas';
    canvasContainer.appendChild(canvas);
    
    // heroSectionをrelativeにして、canvasを配置（paddingの影響を受けないように）
    heroSection.style.position = 'relative';
    heroSection.insertBefore(canvasContainer, heroSection.firstChild);

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let circles = [];
    let phase = 'multiply'; // multiply -> reveal -> fadeout
    let startTime = null;
    
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
      // Canvasコンテナの実際のサイズを取得
      const containerRect = canvasContainer.getBoundingClientRect();
      // Canvasの内部サイズを表示サイズに合わせる（重要：これがないと描画が歪む）
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      
      // デバッグ情報
      console.log('=== Canvas サイズ ===');
      console.log('Canvas width:', canvas.width);
      console.log('Canvas height:', canvas.height);
      console.log('Canvas container width:', containerRect.width);
      console.log('Canvas container height:', containerRect.height);
      console.log('Window innerWidth:', window.innerWidth);
      console.log('heroSection width:', heroSection.getBoundingClientRect().width);
    }

    // ランダムな「O」を生成
    function createRandomCircle() {
      const padding = 50;
      return {
        x: Math.random() * (canvas.width - padding * 2) + padding,
        y: Math.random() * (canvas.height - padding * 2) + padding,
        size: 8 + Math.random() * 12,
        opacity: 0,
        targetOpacity: 0.3 + Math.random() * 0.4,
        speed: 0.01 + Math.random() * 0.02,
        isLogo: false,
        keep: false
      };
    }

    // ロゴパターンの「O」を生成
    function createLogoCircles() {
      // ロゴの中心（3段目の中央、x: 0）がCanvasの中心に来るように配置
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // 座標系の範囲を計算
      // ロゴの中心間距離: x: -195～195 (幅390単位), y: -148～148 (高さ296単位)
      // ロゴ全体のサイズ（「O」の半径を含む）: 横520単位, 縦444単位
      const logoCenterWidth = 390; // 中心間の幅（単位）
      const logoCenterHeight = 296; // 中心間の高さ（単位）
      const logoFullWidth = logoCenterWidth + O_HORIZONTAL_RADIUS * 2; // 520単位
      const logoFullHeight = logoCenterHeight + O_VERTICAL_RADIUS * 2; // 444単位
      
      // 画面サイズに合わせてスケールを計算（余白を考慮）
      // ロゴ全体が画面内に収まるように余白を適度に取る
      const padding = 60; // 余白をさらに減らしてロゴを大きく
      const availableWidth = canvas.width - padding * 2;
      const availableHeight = canvas.height - padding * 2;
      
      // ロゴ全体の縦横比（520:444）を維持しながらスケール
      const scaleX = availableWidth / logoFullWidth;
      const scaleY = availableHeight / logoFullHeight;
      const scale = Math.min(scaleX, scaleY) * 1.105; // 約30%大きく（0.85 * 1.3 ≈ 1.105）
      
      // 「O」のサイズ（縦半径74を基準）
      const verticalRadius = O_VERTICAL_RADIUS * scale;
      const horizontalRadius = O_HORIZONTAL_RADIUS * scale;
      
      // デバッグ情報
      console.log('=== ロゴ配置情報 ===');
      console.log('ロゴ全体サイズ: 横', logoFullWidth, '単位 / 縦', logoFullHeight, '単位');
      console.log('ロゴ全体縦横比:', (logoFullWidth / logoFullHeight).toFixed(4), '(520/444 =', (520/444).toFixed(4), ')');
      console.log('Canvas centerX:', centerX);
      console.log('Canvas centerY:', centerY);
      console.log('Scale:', scale);
      console.log('Available width:', availableWidth);
      console.log('Available height:', availableHeight);
      console.log('O縦横比: 横半径', horizontalRadius, 'px / 縦半径', verticalRadius, 'px');
      console.log('O縦横比比率:', (horizontalRadius / verticalRadius).toFixed(4), '(65/74 =', (65/74).toFixed(4), ')');
      
      const circles = logoPattern.map(pattern => {
        const x = centerX + pattern.x * scale;
        const y = centerY - pattern.y * scale;
        
        // 3段目の中央（id: 7, 8）の位置を確認
        if (pattern.x === 65 || pattern.x === -65) {
          console.log(`Circle id ${pattern.x === 65 ? 7 : 8}: x=${x}, y=${y}, pattern.x=${pattern.x}`);
        }
        
        return {
          // Canvas座標系: ロゴの中心（x: 0）がCanvasの中心に来るように配置
          // yは反転（上から下が正）
          x: x,
          y: y,
          horizontalRadius: horizontalRadius, // 横半径
          verticalRadius: verticalRadius,     // 縦半径
          opacity: 0,
          targetOpacity: 1,
          speed: 0.02,
          isLogo: true,
          keep: pattern.keep
        };
      });
      
      return circles;
    }

    // アニメーションループ
    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = (currentTime - startTime) / 1000; // 秒

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // フェーズ1: 増殖（0-2秒）
      if (phase === 'multiply' && elapsed < 2) {
        // ランダムな「O」を追加
        if (circles.length < 200 && Math.random() < 0.3) {
          circles.push(createRandomCircle());
        }
        
        // 既存の「O」をフェードイン
        circles.forEach(circle => {
          if (!circle.isLogo) {
            circle.opacity = Math.min(circle.opacity + circle.speed, circle.targetOpacity);
          }
        });
      }
      // フェーズ2: ロゴ表示（2-3秒）
      else if (phase === 'multiply' && elapsed >= 2 && elapsed < 3) {
        phase = 'reveal';
        const logoCircles = createLogoCircles();
        circles = circles.concat(logoCircles);
      }
      // フェーズ3: ロゴの「O」を強調（3-3.5秒）
      else if (phase === 'reveal' && elapsed >= 3 && elapsed < 3.5) {
        circles.forEach(circle => {
          if (circle.isLogo) {
            circle.opacity = Math.min(circle.opacity + circle.speed * 2, circle.targetOpacity);
          }
        });
      }
      // フェーズ4: ロゴ以外をフェードアウト（3.5-5秒）
      else if (phase === 'reveal' && elapsed >= 3.5) {
        phase = 'fadeout';
        circles.forEach(circle => {
          if (!circle.keep) {
            circle.targetOpacity = 0;
          }
        });
      }
      else if (phase === 'fadeout') {
        let allFaded = true;
        circles.forEach(circle => {
          if (!circle.keep) {
            circle.opacity = Math.max(circle.opacity - circle.speed * 1.5, 0);
            if (circle.opacity > 0) allFaded = false;
          } else {
            // ロゴの「O」は完全に表示
            circle.opacity = Math.min(circle.opacity + circle.speed, circle.targetOpacity);
          }
        });
        
        // すべてフェードアウトしたら、ロゴのみを残す
        if (allFaded && elapsed > 5) {
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
            // ランダムな「O」は円として描画（アニメーション用）
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.size / 2, 0, Math.PI * 2);
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
      // ロゴの位置とサイズを再計算
      if (phase !== 'multiply') {
        const logoCircles = createLogoCircles();
        circles.forEach((circle, index) => {
          if (circle.isLogo && logoCircles[index]) {
            circle.x = logoCircles[index].x;
            circle.y = logoCircles[index].y;
            circle.horizontalRadius = logoCircles[index].horizontalRadius;
            circle.verticalRadius = logoCircles[index].verticalRadius;
          }
        });
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

