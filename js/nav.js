// 공개 네브 탭 표시/숨김 — site_settings의 nav_*('on'/'off')에 따라 토글
// 숨김 적용이 끝난 뒤에 콘텐츠를 노출 → 탭 깜빡임(생겼다 사라짐) 방지
window.__navReady = (async function applyNavVisibility(){
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

// 인트로 로딩 오버레이(약 1초) → 콘텐츠 등장
(function(){
  function reveal(){
    document.body.classList.add('ready');
    const l = document.getElementById('page-loader');
    if (l){ l.classList.add('hide'); setTimeout(() => l.remove(), 600); }
  }
  // 임베드(SOOP 게시판)는 인트로 없이 즉시 노출
  if (document.documentElement.classList.contains('embed')) { reveal(); return; }
  const minWait = new Promise(r => setTimeout(r, 500));                  // 최소 0.5초
  const navWait = Promise.race([                                        // nav 숨김 완료(최대 2.2초 캡)
    window.__navReady || Promise.resolve(),
    new Promise(r => setTimeout(r, 2200))
  ]);
  Promise.all([minWait, navWait]).then(reveal);
})();
