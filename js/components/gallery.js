export function initGallery() {
  const section = document.querySelector('.section-gallery');
  if (!section) {
    return { destroy() {} };
  }

  return {
    destroy() {}
  };
}
