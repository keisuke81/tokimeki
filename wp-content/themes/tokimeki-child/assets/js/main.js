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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // アニメーション対象要素を監視
  const animateElements = document.querySelectorAll('.sec-mission, .sec-top-projects, .sec-top-news, .project-card, .news-item');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // プロジェクトカードのホバー効果強化
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
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
})();