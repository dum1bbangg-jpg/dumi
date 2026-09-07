window.DumiMounts = window.DumiMounts || {};
DumiMounts.song = function(root) {

  const sb = initSupabase();
  const GENRE_LABELS = { kpop:'Kpop', jpop:'Jpop', pop:'Pop', etc:'기타' };
  let allSongs = [], currentGenre = 'all', currentSearch = '';
  const PAGE_SIZE = 22;
  let currentPage = 1;

  function esc(t){ const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }

  async function loadSongs(){
    try{
      const { data, error } = await sb.from('songs').select('*').order('sort_order', { ascending:true }).order('artist', { ascending:true });
      root.querySelectorById('song-loading-state').style.display = 'none';
      if(error) throw error;
      allSongs = data || [];
      render();
    }catch(e){
      root.querySelectorById('song-loading-state').style.display = 'none';
      root.querySelectorById('song-empty-state').style.display = 'block';
    }
  }
  function genreClass(g){ const map={kpop:'genre-kpop',jpop:'genre-jpop',pop:'genre-pop'}; return map[g]||'genre-etc'; }
  function starsHTML(n){ const c=Math.min(Math.max(parseInt(n)||0,0),5); let s='<span class="stars">'; for(let i=1;i<=5;i++) s+=`<span class="star ${i<=c?'star-on':'star-off'}">${i<=c?'★':'☆'}</span>`; return s+'</span>'; }

  function render(){
    const q = currentSearch.trim().toLowerCase();
    const filtered = allSongs.filter(s => {
      const genreOk = currentGenre==='all' || s.genre===currentGenre;
      const searchOk = !q || (s.artist||'').toLowerCase().includes(q) || (s.title||'').toLowerCase().includes(q);
      return genreOk && searchOk;
    });
    const tbody = root.querySelectorById('song-song-tbody');
    const emptyEl = root.querySelectorById('song-empty-state');
    const noResEl = root.querySelectorById('song-no-result-state');
    root.querySelectorById('song-count-badge').textContent = `${allSongs.length} 곡`;
    if(allSongs.length===0){ emptyEl.style.display='block'; noResEl.style.display='none'; tbody.innerHTML=''; renderPagination(0); return; }
    emptyEl.style.display='none';
    if(filtered.length===0){ noResEl.style.display='block'; tbody.innerHTML=''; renderPagination(0); return; }
    noResEl.style.display='none';
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if(currentPage>totalPages) currentPage=1;
    const start=(currentPage-1)*PAGE_SIZE;
    const paged = filtered.slice(start, start+PAGE_SIZE);
    renderPagination(totalPages);
    tbody.innerHTML = paged.map(s => `
      <tr>
        <td class="artist-cell">${esc(s.artist)||'—'}</td>
        <td class="title-cell">${esc(s.title)||'—'}</td>
        <td class="center"><span class="genre-badge ${genreClass(s.genre)}">${GENRE_LABELS[s.genre]||s.genre||'기타'}</span></td>
        <td class="center">${starsHTML(s.level)}</td>
        <td class="memo-cell">${esc(s.memo)||''}</td>
        <td class="center"><button class="copy-btn" onclick="DumiViews.song.copyTitle(this, '${(s.artist||'').replace(/'/g,"\\'")} - ${(s.title||'').replace(/'/g,"\\'")}')">복사</button></td>
      </tr>`).join('');
  }
  function renderPagination(totalPages){
    const el = root.querySelectorById('song-pagination');
    if(totalPages<=1){ el.innerHTML=''; return; }
    let b = `<button class="page-btn" ${currentPage===1?'disabled':''} onclick="DumiViews.song.goPage(${currentPage-1})">‹</button>`;
    const delta=2;
    for(let i=1;i<=totalPages;i++){
      if(i===1||i===totalPages||(i>=currentPage-delta&&i<=currentPage+delta)){
        b += `<button class="page-btn ${i===currentPage?'active':''}" onclick="DumiViews.song.goPage(${i})">${i}</button>`;
      } else if(i===currentPage-delta-1||i===currentPage+delta+1){ b += `<span style="padding:0 4px;color:#4a3a3066">…</span>`; }
    }
    b += `<button class="page-btn" ${currentPage===totalPages?'disabled':''} onclick="DumiViews.song.goPage(${currentPage+1})">›</button>`;
    el.innerHTML = b;
  }
  function goPage(n){ currentPage=n; render(); root.querySelector('.table-box')?.scrollIntoView({behavior:'smooth',block:'start'}); }
  function fallbackCopy(text){ return new Promise((resolve,reject)=>{ try{ const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0'; root.appendChild(ta); ta.focus(); ta.select(); const ok=document.execCommand('copy'); root.removeChild(ta); ok?resolve():reject(new Error('copy failed')); }catch(e){ reject(e); } }); }
  function copyToClipboard(text){ if(navigator.clipboard && navigator.clipboard.writeText){ return navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text)); } return fallbackCopy(text); }
  function copyTitle(btn, text){ copyToClipboard(text).then(()=>{ btn.textContent='✓'; btn.classList.add('copied'); setTimeout(()=>{btn.textContent='복사';btn.classList.remove('copied');},1500); }).catch(()=>{ btn.textContent='실패'; setTimeout(()=>{btn.textContent='복사';},1500); }); }

  root.querySelectorById('song-search-input').addEventListener('input', e => { currentSearch=e.target.value; currentPage=1; render(); });
  root.querySelectorById('song-filter-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab'); if(!tab) return;
    root.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active'); currentGenre=tab.dataset.genre; currentPage=1; render();
  });

  function songbookRandom(){
    const q = currentSearch.trim().toLowerCase();
    const visible = allSongs.filter(s => (currentGenre==='all'||s.genre===currentGenre) && (!q || (s.artist||'').toLowerCase().includes(q) || (s.title||'').toLowerCase().includes(q)));
    if(!visible.length) return;
    const song = visible[Math.floor(Math.random()*visible.length)];
    const old = root.querySelectorById('randModal'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id='randModal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(74,58,48,.32);backdrop-filter:blur(4px);z-index:999';
    modal.innerHTML = `<div style="background:var(--paper);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:22px 22px;border:2.8px solid var(--ink);border-radius:24px;padding:28px 24px;width:340px;text-align:center;box-shadow:8px 9px 0 rgba(74,58,48,.18);position:fixed;top:320px;left:50%;transform:translateX(-50%)">
        <div style="font-size:2.6rem;margin-bottom:10px">🎲</div>
        <div style="font-size:1.05rem;color:#4a3a3088;margin-bottom:6px">${GENRE_LABELS[song.genre]||song.genre||'기타'}</div>
        <div style="font-size:1.2rem;color:var(--accent-deep);font-weight:700;margin-bottom:4px">${esc(song.artist)||''}</div>
        <div style="font-size:1.7rem;font-weight:700;color:var(--ink);margin-bottom:8px">${esc(song.title)||''}</div>
        <div style="font-size:1.1rem;color:#4a3a3088;margin-bottom:20px">${esc(song.memo)||''}</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button onclick="DumiViews.song.copyToClipboard('${(song.artist||'').replace(/'/g,"\\'")} - ${(song.title||'').replace(/'/g,"\\'")}').then(()=>{DumiViews.song.getElementById('randModal')?.remove()})" style="font-family:inherit;padding:9px 18px;background:var(--accent);color:#fff;border:2.4px solid var(--ink);border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer">복사</button>
          <button onclick="DumiViews.song.getElementById('randModal').remove();DumiViews.song.songbookRandom()" style="font-family:inherit;padding:9px 18px;background:#fff;color:var(--ink);border:2.4px solid var(--ink);border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer">다시</button>
          <button onclick="DumiViews.song.getElementById('randModal').remove()" style="font-family:inherit;padding:9px 16px;background:#fff;color:#4a3a3088;border:2.4px solid var(--ink);border-radius:14px;font-size:1.05rem;cursor:pointer">닫기</button>
        </div></div>`;
    root.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
  }

  if(new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');

return { esc,loadSongs,genreClass,starsHTML,render,renderPagination,goPage,fallbackCopy,copyToClipboard,copyTitle,songbookRandom, getElementById: id => root.querySelectorById(id), querySelector: selector => root.querySelector(selector), start(){loadSongs();} };
};
