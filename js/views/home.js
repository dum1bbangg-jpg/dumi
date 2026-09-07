window.DumiMounts = window.DumiMounts || {};
DumiMounts.home = function(root) {

  if (new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');
  const sb = initSupabase();
  let vodAll = [], vodKind = 'all', vodView = [];

  async function loadVod() {
    const { data } = await sb.from('vod_clips').select('*').order('sort_order').order('created_at');
    vodAll = data || [];
    applyVodFilter();
  }
  function setVodKind(kind, btn) {
    vodKind = kind;
    root.querySelectorAll('#home-vodFilter button').forEach(b => b.classList.remove('on'));
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
    const playerEl = root.querySelectorById('home-vodPlayer');
    const listEl = root.querySelectorById('home-vodList');
    if (!vodView.length) {
      playerEl.innerHTML = '<div class="vod-empty">등록된 영상이 없어요</div>';
      listEl.innerHTML = '';
      return;
    }
    playerEl.innerHTML = `<iframe src="${embedUrl(vodView[0].vod_id)}" allowfullscreen allow="clipboard-write; web-share;"></iframe>`;
    listEl.innerHTML = vodView.map((v, i) => `
      <div class="vod-thumb${i===0?' active':''}" onclick="DumiViews.home.switchVod(${i})" data-idx="${i}">
        ${thumbHtml(v)}
        <span class="vod-kind">${(v.kind||'vod')==='clip'?'클립':'VOD'}</span>
        <div class="vod-thumb-title">${v.title}</div>
      </div>`).join('');
  }
  function switchVod(idx) {
    const v = vodView[idx];
    if (!v) return;
    root.querySelectorById('home-vodPlayer').innerHTML = `<iframe src="${embedUrl(v.vod_id)}" allowfullscreen allow="clipboard-write; web-share;"></iframe>`;
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
      if(s.profile_image){ const img=root.querySelectorById('home-profileImg'); if(img) img.src=s.profile_image; }
      if(s.channel_url){ const b=root.querySelectorById('home-channelBtn'); if(b) b.href=s.channel_url; }
      setTxt('home-heroName', s.hero_name);
      setTxt('home-tagline', s.home-tagline);
      setTxt('home-bv-name', s.bio_name); setTxt('home-bv-debut', s.bio_debut); setTxt('home-bv-birthday', s.bio_birthday);
      setTxt('home-bv-agency', s.bio_agency); setTxt('home-bv-hair', s.bio_hair); setTxt('home-bv-eye', s.bio_eye); setTxt('home-bv-fanname', s.bio_fanname);
      setTxt('home-aboutText', s.about);
      setTxt('home-toMsg', s.to_doukong);
      _renderChips('home-likesChips', s.likes);
      _renderChips('home-dislikesChips', s.dislikes);
    }catch(e){}
  }

return { loadVod,setVodKind,applyVodFilter,thumbHtml,embedUrl,renderVod,switchVod,_renderChips,loadProfile, getElementById: id => root.querySelectorById(id), querySelector: selector => root.querySelector(selector), start(){loadVod();loadProfile();} };
};
