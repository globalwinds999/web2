import { initHero } from './components/hero.js';
import { initGallery } from './components/gallery.js';
import { initCompareSlider } from './components/compareSlider.js';
import { initHeroCarousel } from './components/heroCarousel.js';

const components = [
  initHero(),
  initGallery(),
  initCompareSlider(),
  initHeroCarousel()
];

window.addEventListener('beforeunload', () => {
  components.forEach((component) => {
    if (component && typeof component.destroy === 'function') {
      component.destroy();
    }
  });
});
