(function(){
  'use strict';

  // ヘッダーのスクロール時の縮小効果
  const header = document.querySelector('.site-header');
  if(header) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY || 0;
      header.classList.toggle('is-compact', y > 24);
    }, {passive:true});
  }

  // スクロールアニメーション（Intersection Observer）
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  // 通常の要素用のオブザーバー（上からフェードイン）
  const defaultObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // project-card用のオブザーバー（右側からスライドイン）- ギリギリのタイミング
  // スマホサイズでも動作するように、thresholdとrootMarginを調整
  const isMobile = window.innerWidth <= 640;
  const projectCardObserverOptions = {
    threshold: isMobile ? 0.1 : 0.3, // スマホでは10%、PCでは30%が見えたらトリガー
    rootMargin: isMobile ? '0px 0px -50px 0px' : '0px 0px -100px 0px' // スマホでは50px、PCでは100px手前でトリガー
  };

  const projectCardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // transitionを確実に適用
      entry.target.style.transition = 'transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      if (entry.isIntersecting) {
        // ビューポートに入った時：右側からスライドイン
        entry.target.style.transform = 'translateX(0)';
        entry.target.classList.add('is-visible');
      } else {
        // ビューポートから外れた時：右側に戻す（逆アニメーション）
        const translateXValue = window.innerWidth <= 640 ? '400px' : '900px';
        entry.target.style.transform = `translateX(${translateXValue})`;
        entry.target.classList.remove('is-visible');
      }
    });
  }, projectCardObserverOptions);

  // 通常のアニメーション対象要素を監視
  const defaultAnimateElements = document.querySelectorAll('.sec-mission, .sec-top-projects, .sec-top-news, .news-item');
  defaultAnimateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    defaultObserver.observe(el);
  });

  // project-cardを監視（右側からスライドイン）- 透明度は変更せず横移動のみ
  const projectCards = document.querySelectorAll('.tpl-front .sec-top-projects .project-card, .tpl-archive-project .sec-archive-projects .project-card');
  projectCards.forEach(card => {
    card.style.opacity = '1'; // 透明度は1のまま
    // スマホサイズでは画面幅に応じた移動距離に調整
    const translateXValue = window.innerWidth <= 640 ? '400px' : '900px';
    card.style.transform = `translateX(${translateXValue})`;
    card.style.transition = 'transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // スムーズなイージング
    projectCardObserver.observe(card);
  });

  // プロジェクトカードのホバー効果強化（アーカイブページ用）
  const archiveProjectCards = document.querySelectorAll('.tpl-archive-project .project-card, .project-card:not(.tpl-front .sec-top-projects .project-card)');
  archiveProjectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    });
  });

  // スムーズスクロール
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // ニュースアイテム全体をクリック可能にする
  const newsItems = document.querySelectorAll('.tpl-archive-news .news-item');
  newsItems.forEach(item => {
    const titleLink = item.querySelector('.news-title a');
    if (titleLink) {
      const newsUrl = titleLink.getAttribute('href');
      item.addEventListener('click', function(e) {
        // 既存のリンク（画像やタイトル）をクリックした場合は、そのリンクの動作を優先
        if (e.target.closest('a')) {
          return;
        }
        // カード全体をクリックした場合は、タイトルのリンクに遷移
        e.preventDefault();
        window.location.href = newsUrl;
      });
    }
  });

  // プロジェクトアーカイブページの機能
  const projectItems = document.querySelectorAll('.tpl-archive-project .project-item');
  if (projectItems.length > 0) {
    // 最初の2つのカードにInstagramリンクを追加
    projectItems.forEach((item, index) => {
      if (index < 2) {
        const instagramLink = item.querySelector('.project-instagram-link');
        if (instagramLink) {
          // ACFフィールドからInstagram URLを取得（カスタムフィールドがある場合）
          // ここでは例として、プロジェクトタイトルからInstagram URLを生成
          const title = item.querySelector('.project-title a');
          if (title) {
            const projectSlug = title.getAttribute('href')?.split('/').filter(Boolean).pop() || '';
            // 実際のInstagram URLはACFフィールドやカスタムフィールドから取得する必要があります
            // ここでは例として、プロジェクトスラッグから生成
            const instagramUrl = `https://www.instagram.com/${projectSlug}/`; // 実際のURLに置き換えてください
            
            // InstagramアイコンのSVG
            const instagramIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
            
            instagramLink.innerHTML = `<a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${instagramIcon}</a>`;
          }
        }
      }
    });

    // 最後の2つのカードに説明文の表示/非表示機能を追加
    const totalItems = projectItems.length;
    projectItems.forEach((item, index) => {
      if (index >= totalItems - 2) {
        const toggleDesc = item.querySelector('.project-toggle-desc');
        const additionalDesc = item.querySelector('.project-additional-desc');
        
        if (toggleDesc && additionalDesc) {
          // 追加説明文のテキストを設定（実際のデータはACFフィールドなどから取得）
          const additionalText = additionalDesc.querySelector('.project-additional-text');
          if (additionalText && !additionalText.textContent.trim()) {
            // 実際のテキストはACFフィールドなどから取得する必要があります
            additionalText.textContent = 'ここに追加の説明文が表示されます。実際のテキストはACFフィールドなどから取得してください。';
          }

          // トグルボタンを作成
          const button = document.createElement('button');
          button.textContent = '詳細を見る';
          button.setAttribute('aria-expanded', 'false');
          
          button.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
              additionalDesc.style.display = 'none';
              this.textContent = '詳細を見る';
              this.setAttribute('aria-expanded', 'false');
            } else {
              additionalDesc.style.display = 'block';
              this.textContent = '詳細を閉じる';
              this.setAttribute('aria-expanded', 'true');
            }
          });
          
          toggleDesc.appendChild(button);
        }
      }
    });
  }
})();