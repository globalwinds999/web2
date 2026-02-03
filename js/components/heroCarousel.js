export function initHeroCarousel() {
  const root = document.querySelector('.section-hero-carousel');
  if (!root) {
    return { destroy() {} };
  }

  const ring = root.querySelector('.hero-carousel__ring');
  const cards = [...root.querySelectorAll('.hero-carousel__card')];
  const total = cards.length;
  if (!ring || !total) {
    return { destroy() {} };
  }

  const RADIUS = 500;
  const density = 1;
  const step = (360 / total) * density;

  const DRAG_LEFT = 0.12;
  const DRAG_RIGHT = 0.05;
  const INERTIA_SCALE = 8;
  const SNAP_EASE = 'expo.out';
  const INERTIA_EASE = 'power2.out';
  const ACTIVE_BOOST = 90;
  const TILT_X = -2;
  const TILT_RAD = Math.abs(TILT_X) * Math.PI / 180;

  let angle = 0;
  let velocity = 0;
  let lastX = 0;
  let isDown = false;
  let tween = null;
  let targetAngle = 0;
  let rafId = null;

  const setRing = gsap.quickSetter(ring, 'rotateY', 'deg');

  cards.forEach((card, i) => {
    const local = -((total - 1) / 2) * step + i * step;
    card.dataset.local = local;

    const h = card.offsetHeight;
    const compensateY = Math.tan(TILT_RAD) * (h / 2);

    card.style.setProperty('--z', '0px');
    card.style.setProperty('--scale', '1');

    card.style.transform = `
      translate(-50%, -50%)
      translateY(${compensateY}px)
      rotateY(${local}deg)
      translateZ(calc(${RADIUS}px + var(--z)))
      rotateX(${TILT_X}deg)
      scale3d(var(--scale), var(--scale), 1)
    `;

    card.style.transformStyle = 'preserve-3d';
    card.style.backfaceVisibility = 'hidden';
  });

  function updateDepth() {
    cards.forEach((card) => {
      const local = parseFloat(card.dataset.local || '0');

      const raw = local + angle;
      const diff = ((raw + 180) % 360 + 360) % 360 - 180;
      const absDiff = Math.abs(diff);

      const isActive = absDiff < step * 0.45;
      card.classList.toggle('is-active', isActive);

      const t = Math.min(absDiff / step, 1);

      const scale = 1 + (1 - t) * 0.1;
      const z = (1 - t) * ACTIVE_BOOST;
      const opacity = 0.4 + (1 - t) * 0.6;

      card.style.setProperty('--scale', scale.toFixed(3));
      card.style.setProperty('--z', `${z.toFixed(1)}px`);
      card.style.opacity = opacity.toFixed(3);

      card.style.filter = isActive ? 'none' : 'blur(1.5px)';

      const h = card.offsetHeight;
      const compensateY = Math.tan(TILT_RAD) * (h / 2);

      card.style.transform = `
        translate(-50%, -50%)
        translateY(${compensateY}px)
        rotateY(${local}deg)
        translateZ(calc(${RADIUS}px + var(--z)))
        rotateX(${TILT_X}deg)
        scale3d(var(--scale), var(--scale), 1)
      `;
    });
  }

  function loop() {
    angle += (targetAngle - angle) * 0.08;
    setRing(angle);
    updateDepth();
    rafId = requestAnimationFrame(loop);
  }

  function getSnapTarget(a) {
    return Math.round(a / step) * step;
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.button !== 2) return;
    isDown = true;
    lastX = e.clientX;

    if (tween) tween.kill();
    tween = null;
    velocity = 0;
    root.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDown || e.buttons === 0) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;

    const drag = (e.buttons === 2) ? DRAG_RIGHT : DRAG_LEFT;
    angle += dx * drag;
    targetAngle = angle;
    velocity = dx * drag;
  }

  function onPointerUp(e) {
    isDown = false;
    root.releasePointerCapture(e.pointerId);

    const inertiaTarget = angle + velocity * INERTIA_SCALE;
    targetAngle = getSnapTarget(inertiaTarget);
    const snapTarget = getSnapTarget(inertiaTarget);

    let proxy = { v: angle };

    tween = gsap.to(proxy, {
      v: inertiaTarget,
      duration: 0.35,
      ease: INERTIA_EASE,
      onUpdate() {
        angle = proxy.v;
      },
      onComplete() {
        tween = gsap.to(proxy, {
          v: snapTarget,
          duration: 0.65,
          ease: SNAP_EASE,
          onUpdate() {
            angle = proxy.v;
          }
        });
      }
    });
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY || e.deltaX;
    const scroll = gsap.utils.clamp(-40, 40, delta * 0.6);
    targetAngle += scroll;
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('contextmenu', onContextMenu);

  loop();

  return {
    destroy() {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('contextmenu', onContextMenu);
      if (tween) {
        tween.kill();
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    }
  };
}
