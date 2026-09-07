window.DumiMounts = window.DumiMounts || {};
DumiMounts.profile = function(root) {

  if (new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');
  const sb = initSupabase();
  let vodAll = [], vodKind = 'all', vodView = [], vodPage = 0;
  const VOD_PAGE_SIZE = 6;

  async function loadVod() {
    const { data } = await sb.from('vod_clips').select('*').order('sort_order').order('created_at');
    vodAll = data || [];
    applyVodFilter();
  }
  function setVodKind(kind, btn) {
    vodKind = kind; vodPage = 0;
    root.querySelectorAll('#profile-vodFilter button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    applyVodFilter();
  }
  function applyVodFilter() {
    vodView = vodKind === 'all' ? vodAll : vodAll.filter(v => (v.kind || 'vod') === vodKind);
    renderVod();
  }
  function thumbHtml(v) {
    if (v.thumb_url) return `<img src="${v.thumb_url}" alt="${v.title}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'vod-thumb-bg',textContent:'▶'}))">`;
    return `<div class="vod-thumb-bg">▶</div>`;
  }
  function embedUrl(id){ return `https://vod.sooplive.com/player/${id}/embed?showChat=false&autoPlay=false&mutePlay=false`; }
  function renderVod() {
    const playerEl = root.querySelectorById('profile-vodPlayer');
    const listEl = root.querySelectorById('profile-vodList');
    const pages = Math.max(1, Math.ceil(vodView.length / VOD_PAGE_SIZE));
    vodPage = Math.min(vodPage, pages - 1);
    root.querySelectorById('profile-vod-page').textContent = `${vodPage + 1} / ${pages}`;
    root.querySelectorById('profile-vod-prev').disabled = vodPage === 0;
    root.querySelectorById('profile-vod-next').disabled = vodPage >= pages - 1;
    if (!vodView.length) {
      playerEl.innerHTML = '<div class="vod-empty">등록된 영상이 없어요</div>';
      listEl.innerHTML = '';
      return;
    }
    playerEl.innerHTML = `<iframe src="${embedUrl(vodView[vodPage * VOD_PAGE_SIZE].vod_id)}" allowfullscreen allow="clipboard-write; web-share;"></iframe>`;
    listEl.innerHTML = vodView.slice(vodPage * VOD_PAGE_SIZE, (vodPage + 1) * VOD_PAGE_SIZE).map((v, localIndex) => { const i = vodPage * VOD_PAGE_SIZE + localIndex; return `
      <div class="vod-thumb${i===vodPage * VOD_PAGE_SIZE?' active':''}" onclick="DumiViews.profile.switchVod(${i})" data-idx="${i}">
        ${thumbHtml(v)}
        <span class="vod-kind">${(v.kind||'vod')==='clip'?'클립':'VOD'}</span>
        <div class="vod-thumb-title">${v.title}</div>
      </div>`; }).join('');
  }
  function switchVod(idx) {
    const v = vodView[idx];
    if (!v) return;
    root.querySelectorById('profile-vodPlayer').innerHTML = `<iframe src="${embedUrl(v.vod_id)}" allowfullscreen allow="clipboard-write; web-share;"></iframe>`;
    root.querySelectorAll('.vod-thumb').forEach(t => t.classList.remove('active'));
    const el = root.querySelector(`.vod-thumb[data-idx="${idx}"]`);
    if (el) el.classList.add('active');
  }

  function _renderChips(id, csv){
    const el = root.querySelectorById(id); if(!el) return;
    const items = (csv||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(items.length) el.innerHTML = items.map(x=>`<span class="chip">${x.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</span>`).join('');
  }
  async function loadProfile(){
    try{
      const { data } = await sb.from('site_settings').select('key,value');
      const s = {}; (data||[]).forEach(r => s[r.key] = r.value);
      const setTxt = (id,v) => { if(v!=null && v!==''){ const el=root.querySelectorById(id); if(el) el.textContent = v; } };
      if(s.profile_image){ const img=root.querySelectorById('profile-profileImg'); if(img) img.src=s.profile_image; }
      if(s.channel_url){ const b=root.querySelectorById('profile-channelBtn'); if(b) b.href=s.channel_url; }
      setTxt('profile-heroName', s.hero_name);
      setTxt('profile-tagline', s.tagline);
      setTxt('profile-bv-name', s.bio_name); setTxt('profile-bv-debut', s.bio_debut); setTxt('profile-bv-birthday', s.bio_birthday);
      setTxt('profile-bv-agency', s.bio_agency); setTxt('profile-bv-hair', s.bio_hair); setTxt('profile-bv-eye', s.bio_eye); setTxt('profile-bv-fanname', s.bio_fanname);
      setTxt('profile-aboutText', s.about);
      setTxt('profile-toMsg', s.to_doukong);
      _renderChips('profile-likesChips', s.likes);
      _renderChips('profile-dislikesChips', s.dislikes);
    }catch(e){}
  }

function vodNav(delta) { vodPage = Math.max(0, Math.min(Math.ceil(vodView.length / VOD_PAGE_SIZE)-1, vodPage + delta)); renderVod(); }
  function setTab(tab) {
    root.querySelectorById('profile-about-panel').hidden = tab !== 'about';
    root.querySelectorById('profile-media-panel').hidden = tab !== 'media';
    root.querySelectorAll('[role="tab"]').forEach(button => button.setAttribute('aria-selected', String(button.id === 'profile-tab-' + tab)));
    if(tab !== 'media') root.querySelectorAll('iframe').forEach(frame => { if(frame.hasAttribute('src')) { frame.dataset.resumeSrc = frame.src; frame.removeAttribute('src'); } });
    else root.querySelectorAll('iframe[data-resume-src]').forEach(frame => {frame.src = frame.dataset.resumeSrc;delete frame.dataset.resumeSrc;});
  }
return { setTab,vodNav,loadVod,setVodKind,applyVodFilter,thumbHtml,embedUrl,renderVod,switchVod,_renderChips,loadProfile, getElementById: id => root.querySelectorById(id), querySelector: selector => root.querySelector(selector), start(){loadVod();loadProfile();} };
};
