// Persistent same-document views, following Hira's hash routing / lazy-init pattern.
window.DumiViews = {};
const routes = ['intro', 'home', 'schedule', 'song', 'upbo'];
const names = { intro:'인트로', home:'메인', schedule:'일정', song:'노래책', upbo:'업보' };
let current = null;
let settings = {};
const embedded = new URLSearchParams(location.search).has('embed');
function closeTransientUI(root) {
  if (!root) return;
  root.querySelectorAll('.modal-backdrop, .day-modal-bg').forEach(el => el.classList.remove('open','show'));
  root.querySelector('#randModal')?.remove();
  root.querySelectorAll('iframe').forEach(frame => {
    frame.dataset.resumeSrc = frame.src;
    frame.removeAttribute('src');
  });
}
function applyTabs() {
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.hidden = settings['nav_' + link.dataset.nav] === 'off';
    if (link.hidden) link.style.display = 'none'; else link.style.removeProperty('display');
  });
}
function route() {
  const [requested, anchor] = location.hash.slice(1).split('/');
  const name = routes.includes(requested) ? requested : (embedded ? 'home' : 'intro');
  if (!routes.includes(requested)) history.replaceState(null, '', location.pathname + location.search + '#' + name);
  const next = document.getElementById('view-' + name);
  const changed = current !== name;
  if (changed) {
    closeTransientUI(document.getElementById('view-' + current));
    document.querySelectorAll('[data-view-style]').forEach(link => { link.disabled = link.dataset.viewStyle !== name; });
    document.querySelectorAll('.app-view').forEach(view => {
      view.hidden = view !== next;
      view.classList.remove('is-entering');
    });
    current = name;
    document.body.dataset.view = name;
    document.body.classList.toggle('embed', embedded);
    if (!DumiViews[name]) {
      next.querySelectorById = id => next.querySelector('#' + CSS.escape(id));
      DumiViews[name] = DumiMounts[name](next);
      DumiViews[name].start();
    } else {
      next.querySelectorAll('iframe[data-resume-src]').forEach(frame => { frame.src = frame.dataset.resumeSrc; delete frame.dataset.resumeSrc; });
    }
    next.classList.add('is-entering');
    next.addEventListener('animationend', () => next.classList.remove('is-entering'), { once:true });
    document.title = '두미 · ' + names[name];
    window.scrollTo({ top:0, behavior:'instant' });
    next.focus({ preventScroll:true });
  }
  if (anchor && name === 'home') {
    requestAnimationFrame(() => document.getElementById('home-' + anchor)?.scrollIntoView({ behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  }
  applyTabs();
}
window.addEventListener('hashchange', route);
route();
(async () => {
  try {
    const { data } = await initSupabase().from('site_settings').select('key,value').in('key',['nav_upbo','nav_song','nav_schedule']);
    settings = Object.fromEntries((data || []).map(row => [row.key,row.value]));
    applyTabs();
  } catch (error) { console.warn('탭 설정을 가져오지 못했습니다. 기본 메뉴를 표시합니다.'); }
})();
