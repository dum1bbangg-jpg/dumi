// 공개 네브 탭 표시/숨김 — site_settings의 nav_* 값('on'/'off')에 따라 토글
(async function applyNavVisibility(){
  try{
    if (typeof initSupabase !== 'function') return;
    const sb = initSupabase();
    const { data } = await sb.from('site_settings').select('key,value')
      .in('key', ['nav_upbo','nav_song','nav_schedule']);
    if (!data) return;
    const off = {};
    data.forEach(r => { if (r.value === 'off') off[r.key.replace('nav_','')] = true; });
    document.querySelectorAll('nav.tabs a[data-nav]').forEach(a => {
      if (off[a.dataset.nav]) a.style.display = 'none';
    });
  }catch(e){}
})();
