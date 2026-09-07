window.DumiMounts = window.DumiMounts || {};
DumiMounts.schedule = function(root) {

  const WEEKDAYS = ['일','월','화','수','목','금','토'];
  const MONTHS_EN = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  let calYear, calMonth, allEvents = [], evMap = {};

  function esc(t){ const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }
  function pad(n){ return String(n).padStart(2,'0'); }
  function isToday(dateStr){ const t=new Date(), d=new Date(dateStr+'T00:00:00'); return t.getFullYear()===d.getFullYear()&&t.getMonth()===d.getMonth()&&t.getDate()===d.getDate(); }

  // 일정 유형별 색상 매핑 (QP 방식) — event_type 기준, 같은 유형이면 항상 같은 색
  const TYPE_COLORS = { broadcast:'#ffb3d1', rest:'#d0d0d0', event:'#c5b8e8', collab:'#a8d8d4', tournament:'#aed4f7', other:'#ffd9a0' };
  const TYPE_LABELS = { broadcast:'방송', rest:'휴방', event:'이벤트', collab:'합방', tournament:'대회', other:'기타' };
  function eventColor(ev){ return ev.color || TYPE_COLORS[ev.event_type] || '#ffb3d1'; }
  function typeLabel(ev){ return TYPE_LABELS[ev.event_type] || ev.event_type || '방송'; }
  function hexToRgb(hex){ hex=String(hex||'').replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const n=parseInt(hex,16); if(isNaN(n)||hex.length<6) return '255,143,176'; return `${(n>>16)&255},${(n>>8)&255},${n&255}`; }

  async function loadSchedule(){
    try{
      const sb = initSupabase();
      const { data, error } = await sb.from('schedule_events').select('*')
        .eq('is_hidden', false).order('date', { ascending:true }).order('time', { ascending:true });
      if(error) throw error;
      allEvents = data || [];
      evMap = {};
      allEvents.forEach(ev => { (evMap[ev.date] = evMap[ev.date]||[]).push(ev); });
      const now = new Date();
      calYear = now.getFullYear(); calMonth = now.getMonth();
      renderCalendar();
      renderUpcoming();
    }catch(err){
      console.error(err);
      root.querySelectorById('schedule-calGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#4a3a3077">달력을 불러오지 못했어요</div>';
      root.querySelectorById('schedule-upcomingList').innerHTML = '';
    }
  }

  function renderCalendar(){
    const first = new Date(calYear, calMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0,10);
    root.querySelectorById('schedule-calLabel').textContent = `${calYear}년 ${calMonth+1}월`;

    let html = '';
    for(let i=0;i<startDow;i++) html += '<div class="cal-cell empty"></div>';
    for(let d=1; d<=daysInMonth; d++){
      const dateStr = `${calYear}-${pad(calMonth+1)}-${pad(d)}`;
      const evs = evMap[dateStr] || [];
      const dow = (startDow + d - 1) % 7;
      const today = dateStr === todayStr;
      const annivEv = evs.find(e=>e.is_anniversary);
      const shown = evs.slice(0,3).map(ev => {
        const c = eventColor(ev);
        const t = ev.time ? esc(ev.time.slice(0,5))+' ' : '';
        const memo = (!ev.time && ev.description) ? ' · '+esc(ev.description) : '';
        const star = ev.is_anniversary ? '🎉 ' : '';
        return `<div class="cal-ev${ev.is_anniversary?' anniv':''}" style="background:${c};color:#4a3a30">${star}${t}${esc(ev.title)}${memo}</div>`;
      }).join('');
      const more = evs.length>3 ? `<div class="cal-more">+${evs.length-3}</div>` : '';
      const cls = `cal-cell${today?' today':''}${evs.length?' has-ev':''}${annivEv?' anniv':''}`;
      const annivStyle = annivEv ? ` style="--glow-rgb:${hexToRgb(annivEv.anniv_color)}"` : '';
      const click = evs.length ? ` role="button" tabindex="0" onclick="DumiViews.schedule.showDay('${dateStr}')"` : '';
      html += `<div class="${cls}"${click}${annivStyle}>
        <div class="cal-daynum${dow===0?' sun':''}${dow===6?' sat':''}">${d}</div>
        ${shown}${more}
      </div>`;
    }
    root.querySelectorById('schedule-calGrid').innerHTML = html;
  }

  function calNav(delta){
    calMonth += delta;
    if(calMonth<0){ calMonth=11; calYear--; }
    else if(calMonth>11){ calMonth=0; calYear++; }
    renderCalendar();
  }

  function showDay(dateStr){
    const evs = evMap[dateStr] || [];
    if(!evs.length) return;
    const d = new Date(dateStr+'T00:00:00');
    root.querySelectorById('schedule-dayModalTitle').textContent = `${d.getMonth()+1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
    root.querySelectorById('schedule-dayModalBody').innerHTML = evs.map(ev => {
      const c = eventColor(ev);
      return `<div style="border:2.2px solid ${c};border-radius:14px;padding:12px 14px;margin-bottom:10px;background:${c}40;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <span style="font-size:0.92rem;font-weight:700;background:${c};color:#4a3a30;border-radius:9px;padding:1px 10px">${esc(typeLabel(ev))}</span>
          ${ev.time?`<span style="font-size:1.05rem;color:#4a3a30aa;font-weight:700">🕒 ${esc(ev.time.slice(0,5))}</span>`:''}
        </div>
        <div style="font-size:1.4rem;font-weight:700">${esc(ev.title)}</div>
        ${ev.description?`<div style="font-size:1.1rem;color:#4a3a3099;margin-top:2px">${esc(ev.description)}</div>`:''}
      </div>`;
    }).join('');
    root.querySelectorById('schedule-dayModal').classList.add('show');
  }
  function closeDayModal(){ root.querySelectorById('schedule-dayModal').classList.remove('show'); }

  function eventCard(ev){
    const d = new Date(ev.date+'T00:00:00');
    const today = isToday(ev.date);
    const todayBadge = today ? `<span class="ev-badge-today">오늘</span>` : '';
    const c = eventColor(ev);
    const typeBadge = `<span class="ev-tag" style="background:${c};border-color:${c};color:#4a3a30">${esc(typeLabel(ev))}</span>`;
    const annivCls = ev.is_anniversary ? ' anniv' : '';
    const annivStyle = ev.is_anniversary ? ` --glow-rgb:${hexToRgb(ev.anniv_color)};` : '';
    const star = ev.is_anniversary ? '🎉 ' : '';
    return `<div class="event-card${today?' is-today':''}${annivCls}" style="border-left:7px solid ${c};${annivStyle}">
      <div class="event-date-block">
        <div class="ev-day-num">${d.getDate()}</div>
        <div class="ev-weekday${today?' wd-today':''}">${today ? '오늘' : MONTHS_EN[d.getMonth()]+' · '+WEEKDAYS[d.getDay()]}</div>
      </div>
      <div class="event-info">
        <div class="ev-cell">${ev.time ? `<span class="ev-time">🕒 ${esc(ev.time.slice(0,5))}</span>` : ''}</div>
        <div class="ev-cell"><span class="ev-title">${star}${esc(ev.title)}</span></div>
        <div class="ev-cell"><span class="ev-desc">${ev.description ? esc(ev.description) : ''}</span></div>
        <div class="ev-cell">${typeBadge}</div>
      </div>
    </div>`;
  }

  function renderUpcoming(){
    const el = root.querySelectorById('schedule-upcomingList');
    const today = new Date().toISOString().slice(0,10);
    const up = allEvents.filter(ev => ev.date >= today).slice(0,7);
    root.querySelectorById('schedule-upcomingCnt').textContent = up.length ? up.length+'개' : '';
    el.innerHTML = up.length
      ? up.map(eventCard).join('')
      : `<div class="empty-state"><div class="emoji">📭</div><p>다가오는 일정이 없어요</p></div>`;
  }

  root.querySelectorById('schedule-dayModal').addEventListener('click', e => { if(e.target.id==='schedule-dayModal') closeDayModal(); });
  if(new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');

return { esc,pad,isToday,eventColor,typeLabel,hexToRgb,loadSchedule,renderCalendar,calNav,showDay,closeDayModal,eventCard,renderUpcoming, getElementById: id => root.querySelectorById(id), querySelector: selector => root.querySelector(selector), start(){loadSchedule();} };
};
