export function initHero() {
  const header = document.getElementById('header');
  const heroSection = document.getElementById('hero');
  const video1 = document.getElementById('video1');
  const video2 = document.getElementById('video2');
  const heroContent = document.getElementById('heroContent');
  const overlay = document.getElementById('overlay');
  const heroTitleSpans = document.querySelectorAll('.animated-title span');
  const heroText = document.querySelector('.hero-text');
  const heroBtn = document.querySelector('.hero-btn');
  const logos = document.querySelectorAll('#logo');

  if (!header || !heroSection || !video1 || !video2 || !heroContent || !overlay) {
    return { destroy() {} };
  }

  let headerVisible = false;
  let scrollTicking = false;

  function refreshLogoGif() {
    logos.forEach((logo) => {
      const originalSrc = logo.getAttribute('src')?.split('?')[0];
      if (!originalSrc) return;
      logo.setAttribute('src', `${originalSrc}?t=${Date.now()}`);
    });
  }

  function onVideo1Play() {
    header.classList.remove('scrolled');
  }

  function onVideo1Ended() {
    setTimeout(() => {
      video2.style.display = 'block';
      const playPromise = video2.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
      header.classList.remove('hidden');
      header.classList.remove('scrolled');
      headerVisible = true;
    }, 500);
  }

  function onVideo2Play() {
    heroContent.classList.add('visible');
    heroTitleSpans.forEach((span) => {
      setTimeout(() => {
        span.classList.add('visible');
      }, parseInt(span.dataset.delay || '0', 10));
    });

    setTimeout(() => heroText?.classList.add('visible'), 1400);
    setTimeout(() => heroBtn?.classList.add('visible'), 1800);
  }

  function onVideo2Ended() {
    overlay.classList.add('visible');
  }

  function updateHeaderOnScroll() {
    if (!headerVisible) return;
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      updateHeaderOnScroll();
    });
  }

  function loadVideoSources(video) {
    const sources = Array.from(video.querySelectorAll('source[data-src]'));
    if (!sources.length) return;
    sources.forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });
    video.load();
  }

  let heroObserver = null;

  function handleHeroIntersect(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadVideoSources(video1);
      loadVideoSources(video2);
      const playPromise = video1.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
      heroObserver?.disconnect();
      heroObserver = null;
    });
  }

  heroObserver = new IntersectionObserver(handleHeroIntersect, {
    threshold: 0.2
  });

  heroObserver.observe(heroSection);

  refreshLogoGif();

  video1.addEventListener('play', onVideo1Play);
  video1.addEventListener('ended', onVideo1Ended);
  video2.addEventListener('play', onVideo2Play);
  video2.addEventListener('ended', onVideo2Ended);
  window.addEventListener('scroll', onScroll, { passive: true });

  return {
    destroy() {
      video1.removeEventListener('play', onVideo1Play);
      video1.removeEventListener('ended', onVideo1Ended);
      video2.removeEventListener('play', onVideo2Play);
      video2.removeEventListener('ended', onVideo2Ended);
      window.removeEventListener('scroll', onScroll);
      heroObserver?.disconnect();
    }
  };
}
