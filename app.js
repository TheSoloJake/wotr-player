'use strict';
const $=id=>document.getElementById(id), audio=$('audio');
let catalog=[],viewShow=null,viewEpisodes=[],playingShow=null,playingEpisodes=[],playingIndex=-1,mode='genre',openGenre='Crime & Mystery',requestId=0,sleepUntil=0,sleepTimeout=null;
const cache=new Map();
let searchQuery='', wantsPlayback=false, attempt=0, playbackToken=0, recoveryTimer=null, watchdog=null, recovering=false, resumeAt=0;
function cancelRecovery(){clearTimeout(recoveryTimer);clearTimeout(watchdog);recoveryTimer=null;watchdog=null;recovering=false}
function pausePlayback(){wantsPlayback=false;playbackToken++;cancelRecovery();audio.pause()}
function armWatchdog(){clearTimeout(watchdog);if(wantsPlayback&&!recovering)watchdog=setTimeout(()=>handleFailure(),25000)}
function handleFailure(){
 if(!wantsPlayback||recovering||expired()||!playingShow)return;
 recovering=true;clearTimeout(watchdog);const token=++playbackToken;
 resumeAt=Number.isFinite(audio.currentTime)?audio.currentTime:0;
 audio.pause();
 if(attempt===0){
  attempt=1;$('play-status').textContent='RETRYING…';message('This recording did not load. Retrying once…');
  recoveryTimer=setTimeout(()=>{if(token!==playbackToken||!wantsPlayback||expired())return;recovering=false;audio.load();play();},1200);
 }else{
  const title=playingEpisodes[playingIndex].title;
  const notice=`Could not play “${title}” after retrying.`;
  $('play-status').textContent='RECORDING UNAVAILABLE';
  if(playingIndex+1<playingEpisodes.length){
   message(notice+' Moving to the next episode…');
   recoveryTimer=setTimeout(()=>{if(token!==playbackToken||!wantsPlayback||expired())return;choose(playingShow,playingEpisodes,playingIndex+1,true,notice+' Skipped to the next episode.');},2000);
  }else{wantsPlayback=false;recovering=false;message(notice+' There are no more episodes in this show.');}
 }
}
function skip(seconds){if(!playingShow||!Number.isFinite(audio.duration))return;audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+seconds));}
$('rewind').onclick=()=>skip(-30);$('forward').onclick=()=>skip(30);
$('show-search').oninput=()=>{searchQuery=$('show-search').value.trim().toLocaleLowerCase();renderBrowse();$('browse-list').scrollTop=0};
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=s=>{s=Number(s);if(!Number.isFinite(s)||s<0)return '—';s=Math.floor(s);return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
function duration(d){if(!d)return '—';return String(d).includes(':')?d:time(d)}
function message(s){$('message').textContent=s;$('message').hidden=!s}
function save(){try{localStorage.setItem('wotr-selection',JSON.stringify({show:playingShow.id,file:playingEpisodes[playingIndex].file}))}catch{}}
function drawer(open){$('browser').classList.toggle('open',open);$('shade').hidden=!open;$('drawer-open').setAttribute('aria-expanded',String(open));if(open)$('drawer-close').focus();else $('drawer-open').focus()}
$('drawer-open').onclick=()=>drawer(true);$('drawer-close').onclick=()=>drawer(false);$('shade').onclick=()=>drawer(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('browser').classList.contains('open'))drawer(false);if(e.key==='Tab'&&$('browser').classList.contains('open')){const items=[...$('browser').querySelectorAll('button,a,input')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
function showHTML(s){return `<button class="show-button ${viewShow?.id===s.id?'selected':''}" data-show="${escapeHTML(s.id)}" aria-pressed="${viewShow?.id===s.id}"><span>${escapeHTML(s.title)}</span><small>${s.count}</small></button>`}
function renderBrowse(){const el=$('browse-list');const top=el.scrollTop;$('show-search-wrap').hidden=mode!=='show';if(mode==='show'){const matches=catalog.filter(s=>s.title.toLocaleLowerCase().includes(searchQuery));el.innerHTML=matches.map(showHTML).join('')||'<p class="muted">No shows found. Try a different name.</p>';$('search-count').textContent=searchQuery?`${matches.length} shows found`:'';}else{const genres=[...new Set(catalog.flatMap(s=>s.genres))].sort();el.innerHTML=genres.map(g=>{const shows=catalog.filter(s=>s.genres.includes(g));return `<button class="genre-button ${g===openGenre?'active':''}" data-genre="${escapeHTML(g)}" aria-expanded="${g===openGenre}"><span>${escapeHTML(g)}</span><span>${shows.length} &nbsp; ${g===openGenre?'−':'+'}</span></button>${g===openGenre?`<div class="genre-shows">${shows.map(showHTML).join('')}</div>`:''}`}).join('')}el.scrollTop=top}
$('browse-list').onclick=e=>{const g=e.target.closest('[data-genre]');if(g){openGenre=openGenre===g.dataset.genre?null:g.dataset.genre;renderBrowse()}const b=e.target.closest('[data-show]');if(b){selectShow(catalog.find(s=>s.id===b.dataset.show));if(innerWidth<760)drawer(false)}};
for(const m of ['genre','show'])$(m+'-tab').onclick=()=>{mode=m;$('genre-tab').setAttribute('aria-pressed',String(m==='genre'));$('show-tab').setAttribute('aria-pressed',String(m==='show'));renderBrowse()};
async function getEpisodes(s){if(cache.has(s.id))return cache.get(s.id);const r=await fetch(`episodes/${encodeURIComponent(s.id)}.json`);if(!r.ok)throw Error('load');const data=await r.json();cache.set(s.id,data);return data}
async function selectShow(s){const token=++requestId;viewShow=s;viewEpisodes=[];renderBrowse();$('list-title').textContent=s.title;$('episode-count').textContent='Loading…';$('episode-list').innerHTML='<div class="empty">Loading episodes…</div>';try{const data=await getEpisodes(s);if(token!==requestId)return;viewEpisodes=data;renderEpisodes();$('episode-list').scrollTop=0}catch{if(token===requestId){$('episode-list').innerHTML='<div class="empty">Could not load this show.<br><button id="retry">Try again</button></div>';$('retry').onclick=()=>selectShow(s);$('episode-count').textContent=''}}}
function renderEpisodes(){const top=$('episode-list').scrollTop;$('episode-count').textContent=`${viewEpisodes.length.toLocaleString()} episodes`;$('episode-list').innerHTML=viewEpisodes.map((ep,i)=>{const active=playingShow?.id===viewShow.id&&playingEpisodes[playingIndex]?.file===ep.file;return `<button class="episode ${active?'active':''}" data-index="${i}" ${active?'aria-current="true"':''}><span class="number">${active?'♪':String(i+1).padStart(2,'0')}</span><span class="ep-title">${escapeHTML(ep.title)}</span><span class="runtime">${escapeHTML(duration(ep.duration))}</span></button>`}).join('');$('episode-list').scrollTop=top}
$('episode-list').onclick=e=>{const b=e.target.closest('[data-index]');if(b)choose(viewShow,viewEpisodes,Number(b.dataset.index),true)};
function choose(show,episodes,index,autoplay,notice=''){if(!episodes[index])return;playbackToken++;cancelRecovery();wantsPlayback=autoplay;attempt=0;resumeAt=0;playingShow=show;playingEpisodes=episodes;playingIndex=index;const ep=episodes[index];message(notice);$('rewind').disabled=true;$('forward').disabled=true;audio.src=`https://archive.org/download/${encodeURIComponent(ep.source||show.id)}/${ep.file.split('/').map(encodeURIComponent).join('/')}`;$('now-show').textContent=show.title;$('now-episode').textContent=ep.title;$('now-genre').textContent=show.genres.join(' · ');$('elapsed').textContent='0:00';$('duration').textContent=duration(ep.duration);$('seek').value=0;$('seek').disabled=true;$('play').disabled=false;$('previous').disabled=index===0;$('next').disabled=index===episodes.length-1;save();if(viewEpisodes.length)renderEpisodes();if('mediaSession'in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:ep.title,artist:show.title,album:'WOTR Player'});}if(autoplay)play();else $('play-status').textContent='READY TO PLAY'}
async function play(){
 if(expired()||!playingShow)return;
 wantsPlayback=true;const token=playbackToken;armWatchdog();
 try{await audio.play()}catch(e){
  if(token!==playbackToken||e.name==='AbortError')return;
  if(e.name==='NotAllowedError'){pausePlayback();$('play-status').textContent='PAUSED';message('Your browser needs a tap on Play to begin.');return;}
  handleFailure();
 }
}
$('play').onclick=()=>{if(wantsPlayback)pausePlayback();else{if(audio.error){attempt=0;cancelRecovery();audio.load()}play()}};
$('previous').onclick=()=>choose(playingShow,playingEpisodes,playingIndex-1,true);
$('next').onclick=()=>choose(playingShow,playingEpisodes,playingIndex+1,true);
function syncPlayback(){const paused=audio.paused;$('play').textContent=paused?'▶':'Ⅱ';$('play').setAttribute('aria-label',paused?'Play':'Pause');$('play-status').textContent=paused?'PAUSED':'ON THE AIR';if('mediaSession'in navigator)navigator.mediaSession.playbackState=paused?'paused':'playing'}
audio.addEventListener('play',syncPlayback);audio.addEventListener('pause',syncPlayback);audio.addEventListener('waiting',()=>{$('play-status').textContent='TUNING IN…';armWatchdog()});audio.addEventListener('playing',()=>{if(!expired()&&wantsPlayback){clearTimeout(watchdog);syncPlayback();if(attempt===1&&$('message').textContent==='This recording did not load. Retrying once…')message('')}else audio.pause()});
audio.addEventListener('loadedmetadata',()=>{$('seek').max=Number.isFinite(audio.duration)?audio.duration:100;$('seek').disabled=!Number.isFinite(audio.duration);$('duration').textContent=time(audio.duration);$('rewind').disabled=!Number.isFinite(audio.duration);$('forward').disabled=!Number.isFinite(audio.duration);if(resumeAt&&Number.isFinite(audio.duration)){audio.currentTime=Math.min(resumeAt,audio.duration);resumeAt=0}});
audio.addEventListener('timeupdate',()=>{if(expired())return;if(wantsPlayback&&!audio.paused&&audio.readyState>=3)clearTimeout(watchdog);$('seek').value=audio.currentTime;$('elapsed').textContent=time(audio.currentTime)});
audio.addEventListener('ended',()=>{if(expired()||!wantsPlayback)return;clearTimeout(watchdog);if(playingIndex+1<playingEpisodes.length)choose(playingShow,playingEpisodes,playingIndex+1,true);else{wantsPlayback=false;$('play-status').textContent='SHOW COMPLETE';message('You’ve reached the last episode. Choose another show or try Surprise Me.')}});
audio.addEventListener('error',()=>{if(audio.error)handleFailure()});
audio.addEventListener('stalled',armWatchdog);
$('seek').oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number($('seek').value)};$('volume').oninput=()=>audio.volume=Number($('volume').value);
function clearSleep(){sleepUntil=0;clearTimeout(sleepTimeout);sleepTimeout=null;document.querySelectorAll('[data-minutes]').forEach(b=>b.setAttribute('aria-pressed','false'));$('cancel-sleep').hidden=true}
function expired(){if(sleepUntil&&Date.now()>=sleepUntil){clearSleep();pausePlayback();message('Sleep timer finished. Playback stopped.');return true}return false}
function updateSleep(){if(!sleepUntil||expired())return;$('cancel-sleep').hidden=false;$('cancel-sleep').textContent=`${time((sleepUntil-Date.now())/1000)} · Cancel`}
$('sleep-options').onclick=e=>{const b=e.target.closest('[data-minutes]');if(!b)return;clearSleep();message('');sleepUntil=Date.now()+Number(b.dataset.minutes)*60000;b.setAttribute('aria-pressed','true');sleepTimeout=setTimeout(expired,Number(b.dataset.minutes)*60000);updateSleep()};$('cancel-sleep').onclick=clearSleep;setInterval(updateSleep,1000);document.addEventListener('visibilitychange',expired);window.addEventListener('focus',expired);
$('surprise').onclick=async()=>{if(!catalog.length)return;const b=$('surprise');b.disabled=true;try{const s=catalog[Math.floor(Math.random()*catalog.length)];await selectShow(s);if(viewShow?.id!==s.id||!viewEpisodes.length)return;choose(s,viewEpisodes,Math.floor(Math.random()*viewEpisodes.length),true);if(innerWidth<760&&$('browser').classList.contains('open'))drawer(false);$('episode-list').querySelector('.active')?.scrollIntoView({block:'nearest'})}finally{b.disabled=false}};
if('mediaSession'in navigator){for(const [action,fn]of Object.entries({play:()=>play(),pause:()=>pausePlayback(),seekbackward:()=>skip(-30),seekforward:()=>skip(30),previoustrack:()=>{if(playingIndex>0)choose(playingShow,playingEpisodes,playingIndex-1,true)},nexttrack:()=>{if(playingIndex+1<playingEpisodes.length)choose(playingShow,playingEpisodes,playingIndex+1,true)},seekto:d=>{if(Number.isFinite(audio.duration))audio.currentTime=d.seekTime}}))try{navigator.mediaSession.setActionHandler(action,fn)}catch{}}
async function init(){try{const r=await fetch('catalog.json');if(!r.ok)throw Error();catalog=await r.json();$('catalog-count').textContent=`${catalog.length} SHOWS · OTRR`;let saved;try{saved=JSON.parse(localStorage.getItem('wotr-selection'))}catch{}const s=catalog.find(s=>s.id===saved?.show)||catalog.find(s=>/^Johnny Dollar|^Yours Truly, Johnny Dollar/i.test(s.title))||catalog[0];openGenre=s.genres[0];renderBrowse();await selectShow(s);if(saved?.show===s.id){const i=viewEpisodes.findIndex(ep=>ep.file===saved.file);if(i>=0)choose(s,viewEpisodes,i,false)}}catch{$('browse-list').innerHTML='<p class="muted">The collection could not be loaded.</p><button id="reload">Try again</button>';$('reload').onclick=init}}
init();
