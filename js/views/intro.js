window.DumiMounts = window.DumiMounts || {};
DumiMounts.intro = function(root) {
// One replaceable image shared by all three clipped panels.
const INTRO_ART = { src: '/assets/intro/doomi-portrait.png', x: '50%', y: '50%' };
const artwork = root.querySelectorById('intro-introArtwork');
artwork.style.setProperty('--image-x', INTRO_ART.x);
artwork.style.setProperty('--image-y', INTRO_ART.y);
root.querySelectorAll('[data-intro-image]').forEach(img => { img.src = INTRO_ART.src; });
const motion = matchMedia('(prefers-reduced-motion: reduce)');
artwork.addEventListener('pointermove', event => {
  if (motion.matches || event.pointerType !== 'mouse') return;
  const rect = artwork.getBoundingClientRect();
  artwork.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - .5) * 2);
  artwork.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - .5) * 2);
});
artwork.addEventListener('pointerleave', () => {
  artwork.style.setProperty('--px', 0); artwork.style.setProperty('--py', 0);
});

return { getElementById: id => root.querySelectorById(id), querySelector: selector => root.querySelector(selector), start(){} };
};
