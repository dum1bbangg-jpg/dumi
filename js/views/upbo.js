window.DumiMounts = window.DumiMounts || {};
DumiMounts.upbo = function(root) {

const sb = initSupabase();
let allMembers = [], memberTasks = {};
let currentPage = 1, _renderList = [];
const PAGE_SIZE = 16; // 940 × 1400 canvas budget

function esc(t){ const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }
function avatarUrl(uid){ if(!uid) return null; const pre=uid.substring(0,2); return `https://profile.img.sooplive.com/LOGO/${pre}/${uid}/${uid}.jpg`; }
function nickRank(s){
  const c = (s||'').trim().charAt(0);
  if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c)) return 0;  // 한글(가나다)
  if(/[A-Za-z]/.test(c)) return 1;            // 영문(ABCD)
  return 2;                                    // 숫자·특문
}
function totalQtyOf(m){ return (memberTasks[m.id]||[]).reduce((s,t)=>s+(t.quantity||1),0); }
function dispNick(m){ return m.soopNick || m.nickname; }   // 방송국 실시간 닉 우선, 없으면 저장된 닉
function memberSort(a, b){
  const ha = totalQtyOf(a) > 0 ? 0 : 1, hb = totalQtyOf(b) > 0 ? 0 : 1;
  if(ha !== hb) return ha - hb;               // 업보 있는 사람 먼저, 없는(코인만) 사람 뒤로
  const ra = nickRank(dispNick(a)), rb = nickRank(dispNick(b));
  if(ra !== rb) return ra - rb;               // 한글 → 영문 → 숫자·특문
  return dispNick(a).localeCompare(dispNick(b), 'ko');
}

async function load(){
  try{
    const [{ data: settings }, { data: members }, { data: tasks }] = await Promise.all([
      sb.from('upbo_settings').select('*').eq('key','last_updated').maybeSingle(),
      sb.from('upbo_members').select('*').order('sort_order').order('nickname'),
      sb.from('upbo_tasks').select('*, upbo_task_types(id,name,category,sort_order)').gt('quantity', 0)
    ]);
    if(settings?.value) root.querySelectorById('upbo-updatedLabel').textContent = '갱신일: ' + settings.value;
    memberTasks = {};
    (tasks||[]).forEach(t => { (memberTasks[t.member_id] = memberTasks[t.member_id] || []).push(t); });
    allMembers = (members||[]).filter(m => ((memberTasks[m.id]?.length) || m.coins > 0) && !m.is_hidden).sort(memberSort);
    root.querySelectorById('upbo-loadingState').style.display = 'none';
    if(!allMembers.length){ root.querySelectorById('upbo-emptyState').style.display='block'; return; }
    render(allMembers);
    hydrateNicks();
  }catch(e){
    root.querySelectorById('upbo-loadingState').style.display = 'none';
    root.querySelectorById('upbo-emptyState').style.display = 'block';
  }
}

function render(members){
  _renderList = members;
  const totalPages = Math.ceil(members.length / PAGE_SIZE);
  if(currentPage > totalPages) currentPage = totalPages || 1;
  renderPage();
}

function renderPage(){
  const grid = root.querySelectorById('upbo-memberGrid');
  const empty = root.querySelectorById('upbo-emptyState');
  const members = _renderList;
  if(!members.length){ empty.style.display='block'; grid.innerHTML=''; renderPagination(0); return; }
  empty.style.display = 'none';
  const start = (currentPage-1)*PAGE_SIZE;
  const paged = members.slice(start, start+PAGE_SIZE);
  grid.innerHTML = paged.map((m) => {
    const tasks = memberTasks[m.id] || [];
    const totalQty = tasks.reduce((s,t) => s + (t.quantity||1), 0);
    const url = avatarUrl(m.user_id);
    const imgHtml = url ? `<img src="${url}" alt="${esc(m.nickname)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
    const fallback = `<span style="${url?'display:none':''}">🐱</span>`;
    return `<div class="member-card" onclick="DumiViews.upbo.openUpboModal('${m.id}', event)">
      <div class="member-avatar">${imgHtml}${fallback}</div>
      <div class="member-nick">${esc(dispNick(m))}</div>
      ${m.user_id ? `<div class="member-id">(${esc(m.user_id)})</div>` : ''}
      <div class="count-row"><span class="member-count">업보 ${totalQty}</span>${m.coins>0?`<span class="coin-count">🪙 ${m.coins}</span>`:''}</div>
    </div>`;
  }).join('');
  const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:.05});
  grid.querySelectorAll('.member-card').forEach(el => obs.observe(el));
  renderPagination(Math.ceil(members.length / PAGE_SIZE));
}

function renderPagination(totalPages){
  const el = root.querySelectorById('upbo-pagination');
  if(totalPages <= 1){ el.innerHTML=''; return; }
  let b = `<button class="page-btn" ${currentPage===1?'disabled':''} onclick="DumiViews.upbo.goPage(${currentPage-1})">‹</button>`;
  const delta=2;
  for(let i=1;i<=totalPages;i++){
    if(i===1||i===totalPages||(i>=currentPage-delta&&i<=currentPage+delta)){
      b += `<button class="page-btn ${i===currentPage?'active':''}" onclick="DumiViews.upbo.goPage(${i})">${i}</button>`;
    } else if(i===currentPage-delta-1||i===currentPage+delta+1){ b += `<span style="padding:0 4px;color:#4a3a3066">…</span>`; }
  }
  b += `<button class="page-btn" ${currentPage===totalPages?'disabled':''} onclick="DumiViews.upbo.goPage(${currentPage+1})">›</button>`;
  el.innerHTML = b;
}

function goPage(n){ currentPage=n; renderPage(); root.querySelector('.member-grid')?.scrollIntoView({behavior:'smooth',block:'start'}); }

function filteredMembers(){
  const q = root.querySelectorById('upbo-searchInput').value.toLowerCase().trim();
  if(!q) return allMembers;
  return allMembers.filter(m => dispNick(m).toLowerCase().includes(q) || (m.user_id||'').toLowerCase().includes(q));
}
root.querySelectorById('upbo-searchInput').addEventListener('input', () => { currentPage = 1; render(filteredMembers()); });
async function hydrateNicks(){
  const targets = allMembers.filter(m => m.user_id);
  if(!targets.length) return;
  await Promise.allSettled(targets.map(async m => {
    try{
      const r = await fetch(`/api/soop-nick?id=${encodeURIComponent(m.user_id)}`);
      const j = await r.json();
      if(j && j.nick) m.soopNick = j.nick;
    }catch(e){}
  }));
  allMembers.sort(memberSort);
  render(filteredMembers());
}

function openUpboModal(memberId, clickEvent){
  const cardRect = clickEvent?.currentTarget ? clickEvent.currentTarget.getBoundingClientRect() : null;
  const m = allMembers.find(x => String(x.id) === String(memberId));
  if(!m) return;
  const tasks = (memberTasks[memberId] || []).slice().sort((a, b) => {
    const na = a.upbo_task_types?.name || '', nb = b.upbo_task_types?.name || '';
    const isKo = s => /^[가-힣]/.test(s), isEn = s => /^[A-Za-z]/.test(s);
    const rank = s => isKo(s) ? 0 : isEn(s) ? 1 : 2;
    if(rank(na) !== rank(nb)) return rank(na) - rank(nb);
    return na.localeCompare(nb, 'ko');
  });
  const avatarEl = root.querySelectorById('upbo-modal-avatar');
  const url = avatarUrl(m.user_id);
  avatarEl.innerHTML = url ? `<img src="${url}" alt="" onerror="this.parentElement.innerHTML='<span>🐱</span>'" style="width:100%;height:100%;object-fit:cover">` : '<span>🐱</span>';
  root.querySelectorById('upbo-modal-nick').textContent = dispNick(m);
  root.querySelectorById('upbo-modal-uid').textContent = m.user_id ? `(${m.user_id})` : '';
  root.querySelectorById('upbo-modal-coin').innerHTML = m.coins>0 ? `<span class="coin-count">🪙 코인 ${m.coins}개</span>` : '';
  const listEl = root.querySelectorById('upbo-modal-task-list');
  listEl.innerHTML = tasks.map(t => {
    const isEvent = t.upbo_task_types?.category === 'event';
    const isPrep = !!t.is_prepared;
    const rowCls = `task-row${isEvent?' evt':''}${isPrep?' prep':''}`;
    const tags = `${isEvent?'<span class="mini-tag evt">이벤트</span>':''}${isPrep?'<span class="mini-tag prep">✓ 준비</span>':''}`;
    return `<div class="${rowCls}">
      <div>
        <div class="task-name">${esc(t.upbo_task_types?.name||'')}${tags}</div>
        ${t.memo ? `<div class="task-memo-txt">${esc(t.memo)}</div>` : ''}
      </div>
      <span class="task-qty">×${t.quantity||1}</span>
    </div>`;
  }).join('') || '<div style="text-align:center;color:#4a3a3088;padding:16px;font-size:1.15rem">보유 업보가 없어요 🪙</div>';
  const modalEl = root.querySelectorById('upbo-upboModal');
  modalEl.classList.add('open');
  requestAnimationFrame(() => {
    const modal = modalEl.querySelector('.modal-box');
    const vh = window.innerHeight;
    const mh = Math.min(modal.offsetHeight, vh - 32);
    let top = cardRect ? (cardRect.top + cardRect.height / 2 - mh / 2) : (vh - mh) / 2;
    top = Math.max(16, Math.min(top, vh - mh - 16));
    modal.style.top = top + 'px';
  });
}

function closeUpboModal(e){ if(e.target===e.currentTarget){ root.querySelectorById('upbo-upboModal').classList.remove('open'); root.querySelector('#upbo-upboModal .modal-box').style.top = ''; } }
document.addEventListener('keydown', e => { if(root.hidden) return; if(e.key==='Escape'){ root.querySelectorById('upbo-upboModal').classList.remove('open'); root.querySelectorById('upbo-inquiryModal').classList.remove('open'); root.querySelectorById('upbo-coinGuideModal').classList.remove('open'); }});

function openInquiry(){
  root.querySelectorById('upbo-inquiryForm').style.display='block';
  root.querySelectorById('upbo-inquirySuccess').style.display='none';
  root.querySelectorById('upbo-iNick').value='';
  root.querySelectorById('upbo-iContent').value='';
  root.querySelectorById('upbo-inquiryModal').classList.add('open');
}
function closeInquiry(e){ if(e.target===e.currentTarget) root.querySelectorById('upbo-inquiryModal').classList.remove('open'); }
function openCoinGuide(){ root.querySelectorById('upbo-coinGuideModal').classList.add('open'); }
function closeCoinGuide(e){ if(e.target===e.currentTarget) root.querySelectorById('upbo-coinGuideModal').classList.remove('open'); }
async function submitInquiry(){
  const nick = root.querySelectorById('upbo-iNick').value.trim();
  const content = root.querySelectorById('upbo-iContent').value.trim();
  if(!nick||!content) return;
  const { error } = await sb.from('upbo_inquiries').insert({ nickname:nick, content });
  if(error){ alert('접수 실패: '+error.message); return; }
  root.querySelectorById('upbo-inquiryForm').style.display='none';
  root.querySelectorById('upbo-inquirySuccess').style.display='block';
  setTimeout(() => root.querySelectorById('upbo-inquiryModal').classList.remove('open'), 2000);
}

if(new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');

return { esc,avatarUrl,nickRank,totalQtyOf,dispNick,memberSort,load,render,renderPage,renderPagination,goPage,filteredMembers,hydrateNicks,openUpboModal,closeUpboModal,openInquiry,closeInquiry,openCoinGuide,closeCoinGuide,submitInquiry, getElementById: id => root.querySelectorById(id), querySelector: selector => root.querySelector(selector), start(){load();} };
};
