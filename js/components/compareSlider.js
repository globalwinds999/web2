export function initCompareSlider() {
  const container = document.getElementById('compareContainer');
  const slider = document.getElementById('slider');
  const videoAfter = document.getElementById('videoAfter');
  const videoBefore = document.getElementById('videoBefore');

  if (!container || !slider || !videoAfter || !videoBefore) {
    return { destroy() {} };
  }

  let isDraggingSlider = false;
  let autoTween = null;
  const margin = 10;
  let rafId = null;
  let pendingX = null;

  function setVideoSrc(video) {
    const source = video.dataset.src;
    if (source && !video.src) {
      video.src = source;
      video.load();
    }
  }

  function setSliderPosition(x, isAuto = false) {
    const rect = container.getBoundingClientRect();

    if (x < margin) x = margin;
    if (x > rect.width - margin) x = rect.width - margin;

    if (isDraggingSlider && isAuto) return;

    slider.style.left = `${x}px`;
    const rightInset = Math.round(rect.width - x);
    videoAfter.style.clipPath = `inset(0px ${rightInset}px 0px 0px)`;
  }

  function scheduleSliderUpdate(x, isAuto = false) {
    pendingX = { x, isAuto };
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!pendingX) return;
      setSliderPosition(pendingX.x, pendingX.isAuto);
      pendingX = null;
    });
  }

  function sliderStartDrag(e) {
    e.preventDefault();
    isDraggingSlider = true;
    if (autoTween) {
      autoTween.kill();
      autoTween = null;
    }
  }

  function sliderDrag(e) {
    if (!isDraggingSlider) return;
    let clientX = e.clientX;
    if (e.touches) clientX = e.touches[0].clientX;
    const rect = container.getBoundingClientRect();
    scheduleSliderUpdate(clientX - rect.left);
  }

  function sliderEndDrag() {
    isDraggingSlider = false;
  }

  slider.addEventListener('mousedown', sliderStartDrag);
  slider.addEventListener('touchstart', sliderStartDrag, { passive: false });

  window.addEventListener('mousemove', sliderDrag);
  window.addEventListener('touchmove', sliderDrag, { passive: false });

  window.addEventListener('mouseup', sliderEndDrag);
  window.addEventListener('touchend', sliderEndDrag);

  function initSlider() {
    const rect = container.getBoundingClientRect();
    scheduleSliderUpdate(rect.width / 2);
  }

  initSlider();

  function handleResize() {
    const rect = container.getBoundingClientRect();
    const left = parseFloat(slider.style.left) || rect.width / 2;
    scheduleSliderUpdate(Math.min(Math.max(left, margin), rect.width - margin));
  }

  window.addEventListener('resize', handleResize);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      setVideoSrc(videoBefore);
      setVideoSrc(videoAfter);

      const playBefore = videoBefore.play();
      if (playBefore?.catch) {
        playBefore.catch(() => {});
      }
      const playAfter = videoAfter.play();
      if (playAfter?.catch) {
        playAfter.catch(() => {});
      }

      if (!autoTween) {
        const rect = container.getBoundingClientRect();
        const center = rect.width / 2;

        autoTween = gsap.to({}, {
          duration: 2,
          delay: 2,
          onUpdate() {
            scheduleSliderUpdate(center - (center - margin) * this.progress(), true);
          },
          onComplete: () => {
            autoTween = null;
          }
        });
      }

      observer.unobserve(container);
    });
  }, { threshold: 0.5 });

  observer.observe(container);

  return {
    destroy() {
      slider.removeEventListener('mousedown', sliderStartDrag);
      slider.removeEventListener('touchstart', sliderStartDrag);
      window.removeEventListener('mousemove', sliderDrag);
      window.removeEventListener('touchmove', sliderDrag);
      window.removeEventListener('mouseup', sliderEndDrag);
      window.removeEventListener('touchend', sliderEndDrag);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (autoTween) {
        autoTween.kill();
      }
    }
  };
}
