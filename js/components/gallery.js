export function initGallery() {
  const section = document.querySelector('.section-gallery');
  const ring = section?.querySelector('.gallery-ring');
  const imgs = section ? Array.from(section.querySelectorAll('.gallery-img')) : [];

  if (!section || !ring || imgs.length === 0) {
    return { destroy() {} };
  }

  const total = imgs.length;
  const galleryAngle = 360 / total;
  const radius = 900;

  const galleryState = {
    rotation: 0,
    targetRotation: 0
  };

  let idleTimer = null;
  const IDLE_DELAY = 2000;
  let lastUpdateTime = null;
  let isDragging = false;
  let lastMouseX = 0;
  let velocity = 0;
  let lastTime = 0;
  let rafId = null;
  let isInitialized = false;

  const applyRingCursor = (cursor) => {
    ring.style.cursor = cursor;
  };

  function resetIdleSnap() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!isDragging) {
        snapToClosestSlide();
      }
    }, IDLE_DELAY);
  }

  function updateBackground(rotation) {
    if (!isInitialized) return;
    let rot = ((rotation % 360) + 360) % 360;
    let index = Math.round(rot / galleryAngle) % total;
    index = (total - index) % total;
    const bg = imgs[index]?.style.backgroundImage;
    if (!bg) return;
    section.style.backgroundImage = bg;
    section.style.backgroundSize = 'cover';
    section.style.backgroundPosition = 'center center';
    section.style.transition = 'background-image 0.5s ease';
  }

  function updateScales(rotation) {
    if (!isInitialized) return;
    const now = Date.now();
    lastUpdateTime = now;

    for (let i = 0; i < total; i++) {
      const el = imgs[i];
      let imgAngle = i * galleryAngle;
      let rot = imgAngle + rotation;
      rot = rot % 360;
      if (rot > 180) rot -= 360;
      if (rot < -180) rot += 360;

      const absRot = Math.abs(rot);
      const centerScale = 1.2;
      const edgeScale = 0.65;
      const t = Math.min(absRot / 180, 1);
      const scale = centerScale + (edgeScale - centerScale) * Math.pow(t, 1.4);

      const baseRadius = radius;
      const zOffset = 220;
      const z = -baseRadius + (1 - t) * zOffset;

      if (!el._scaleTween) {
        el._scaleTween = gsap.to(el, {
          scale: scale,
          z: z,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
          transformOrigin: `50% 50% ${radius}px`,
          onComplete: () => {
            el._scaleTween = null;
          }
        });
      } else {
        el._scaleTween.vars.scale = scale;
        el._scaleTween.vars.z = z;
        el._scaleTween.invalidate().restart();
      }

      const maxBlur = 2.4;
      const blurAmount = Math.min(t * maxBlur, maxBlur);

      gsap.to(el, {
        filter: `blur(${blurAmount}px)`,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true
      });

    }
  }

  function snapToClosestSlide() {
    const rot = galleryState.rotation;
    const nearestIndex = Math.round(-rot / galleryAngle) % total;
    const targetRotation = -nearestIndex * galleryAngle;

    galleryState.targetRotation = targetRotation;

    gsap.to(galleryState, {
      rotation: targetRotation,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        updateScales(galleryState.rotation);
        updateBackground(galleryState.rotation);
      }
    });
  }

  function applyInitialTransforms() {
    gsap.set(ring, {
      rotationY: 0,
      cursor: 'grab'
    });

    gsap.set(imgs, {
      rotateY: (i) => i * galleryAngle,
      transformOrigin: `50% 50% ${radius}px`,
      z: -radius,
      scale: 1,
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    });
  }

  function loadGalleryBackgrounds() {
    imgs.forEach((img) => {
      const bg = img.dataset.bg;
      if (bg) {
        img.style.backgroundImage = `url('${bg}')`;
      }
    });
    updateBackground(0);
    updateScales(0);
    isInitialized = true;
  }

  let galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadGalleryBackgrounds();
        galleryObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });

  galleryObserver.observe(section);

  function dragStart(e) {
    isDragging = true;
    clearTimeout(idleTimer);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    lastMouseX = clientX;
    lastTime = Date.now();
    velocity = 0;

    applyRingCursor('grabbing');
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: false });
  }

  function drag(e) {
    if (!isDragging) return;
    resetIdleSnap();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - lastMouseX;
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;

    if (deltaTime > 0) {
      velocity = -deltaX * 0.5;
    }

    galleryState.rotation -= deltaX * 0.4;
    lastMouseX = clientX;
    lastTime = currentTime;
  }

  function dragEnd() {
    if (!isDragging) return;

    isDragging = false;
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('touchmove', drag);
    applyRingCursor('grab');

    if (Math.abs(velocity) > 0.1) {
      gsap.to(galleryState, {
        rotation: galleryState.rotation + velocity * 10,
        duration: 1,
        ease: 'power2.out',
        onUpdate: () => {
          updateScales(galleryState.rotation);
          updateBackground(galleryState.rotation);
        },
        onComplete: () => {
          resetIdleSnap();
        }
      });
    } else {
      resetIdleSnap();
    }
  }

  function onClickImg(event) {
    if (isDragging) return;
    const target = event.currentTarget;
    const index = imgs.indexOf(target);
    if (index === -1) return;
    const targetRotation = -index * galleryAngle;

    gsap.to(galleryState, {
      rotation: targetRotation,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        updateScales(galleryState.rotation);
        updateBackground(galleryState.rotation);
      }
    });
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    const currentRotation = galleryState.rotation;
    ring.style.transform = `rotateX(6deg) rotateY(${currentRotation}deg)`;
    updateBackground(currentRotation);
    updateScales(currentRotation);
  }

  function onBeforeUnload() {
    imgs.forEach((img) => {
      if (img._scaleTween) {
        img._scaleTween.kill();
      }
    });
  }

  applyInitialTransforms();
  animate();

  ring.addEventListener('mousedown', dragStart);
  ring.addEventListener('touchstart', dragStart, { passive: false });
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);
  imgs.forEach((img) => img.addEventListener('click', onClickImg));
  window.addEventListener('beforeunload', onBeforeUnload);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
      galleryObserver.disconnect();
      ring.removeEventListener('mousedown', dragStart);
      ring.removeEventListener('touchstart', dragStart);
      window.removeEventListener('mouseup', dragEnd);
      window.removeEventListener('touchend', dragEnd);
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('touchmove', drag);
      imgs.forEach((img) => img.removeEventListener('click', onClickImg));
      window.removeEventListener('beforeunload', onBeforeUnload);
    }
  };
}
