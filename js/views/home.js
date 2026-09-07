window.DumiMounts = window.DumiMounts || {};
DumiMounts.home = function(root) {
  const screen = root.querySelector('.showcase');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  screen.addEventListener('pointermove', event => {
    if (motion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = screen.getBoundingClientRect();
    screen.style.setProperty('--character-x', ((event.clientX - bounds.left) / bounds.width - .5) * 12 + 'px');
    screen.style.setProperty('--character-y', ((event.clientY - bounds.top) / bounds.height - .5) * 8 + 'px');
  });
  screen.addEventListener('pointerleave', () => {
    screen.style.removeProperty('--character-x');
    screen.style.removeProperty('--character-y');
  });
  async function loadHome() {
    const { data } = await initSupabase().from('site_settings').select('key,value').in('key',['hero_name','tagline','channel_url']);
    const values = Object.fromEntries((data || []).map(row => [row.key,row.value]));
    if(values.hero_name) root.querySelectorById('home-heroName').textContent = values.hero_name;
    if(values.tagline) root.querySelectorById('home-tagline').textContent = values.tagline;
    if(values.channel_url) root.querySelectorById('home-channelBtn').href = values.channel_url;
  }
  return {start(){loadHome().catch(()=>{});}};
};
