const $=id=>document.getElementById(id),m=$('modal'),mb=$('mbody');$('y').textContent=new Date().getFullYear();
const acts=x=>x.soon?`<div class="acts"><span class="badge">Coming Soon</span>${x.follow?`<a class="ln" target="_blank" rel="noopener" href="${x.follow}">Follow on itch.io →</a>`:''}</div>`:`<div class="acts">${x.play?`<a class="btn" target="_blank" rel="noopener" href="${x.play}">${x.playLabel||'Play'}</a>`:''}${x.download?`<a class="btn ghost" data-dl="${x.id}" href="${x.dlUrl||x.download}" download>${x.dlLabel||x.downloadLabel||'Download'}</a>`:''}</div>${x.others&&x.others.length?`<small class="oth">Other platforms: ${x.others.map(o=>`<a href="${o.url}" download>${o.os}</a>`).join(' · ')}</small>`:''}`;
const OS=/Mac/i.test(navigator.platform+navigator.userAgent)&&!/iPhone|iPad/.test(navigator.userAgent)?'mac':/Linux|X11/.test(navigator.userAgent)&&!/Android/.test(navigator.userAgent)?'linux':'win';
const EXT={win:[/\.exe$/i,'Windows'],mac:[/\.dmg$/i,'Mac'],linux:[/\.AppImage$/i,'Linux']};
function resolveDl(x){fetch(x.releaseApi).then(r=>r.json()).then(r=>{const as=r.assets||[],f={};
 for(const k in EXT){const a=as.find(a=>EXT[k][0].test(a.name));if(a)f[k]=a.browser_download_url}
 if(!f.win&&!f.mac&&!f.linux)return;const k=f[OS]?OS:(f.win?'win':Object.keys(f)[0]);
 x.dlUrl=f[k];x.dlLabel='Download for '+EXT[k][1];x.others=Object.keys(f).filter(o=>o!==k).map(o=>({os:EXT[o][1],url:f[o]}));
 document.querySelectorAll(`[data-dl="${x.id}"]`).forEach(b=>{b.href=x.dlUrl;b.textContent=x.dlLabel;const p=b.parentNode,n=p.nextElementSibling;if(n&&n.classList.contains('oth'))n.remove();
  if(x.others.length)p.insertAdjacentHTML('afterend',`<small class="oth">Other platforms: ${x.others.map(o=>`<a href="${o.url}" download>${o.os}</a>`).join(' · ')}</small>`)})}).catch(()=>{})}
const FS=GAMES.filter(x=>x.featured);
const fg=f=>`<div class="feat${f.flagship?' flag':''}${f.pixel?' px':''}"><div class="fimg"><img src="${f.cover}" alt="${f.title}">${f.flagship&&f.shots.length>1?`<div class="fth">${f.shots.slice(1,4).map(s=>`<img src="${s}" alt="" loading="lazy">`).join('')}</div>`:''}</div><div class="ftx"><h3>${f.title}</h3><p class="tag">${f.tag}</p>${f.chips?`<ul class="chips">${f.chips.map(c=>`<li>${c}</li>`).join('')}</ul>`:''}<p>${f.desc}</p>${acts(f)}<button class="ln more" data-id="${f.id}">View details →</button></div></div>`;
if(FS.length){const fl=FS.every(x=>x.flagship);$('featured').innerHTML=`<h2 class="lbl">${fl?(FS.length>1?'Flagship Games':'Flagship Game'):'Featured'}</h2>${FS.map(fg).join('')}`}
GAMES.filter(x=>!x.featured).forEach(x=>{const c=document.createElement('article');c.className='card';c.tabIndex=0;c.dataset.id=x.id;
 c.innerHTML=`${x.soon?'<span class="badge abs">Coming Soon</span>':''}<img src="${x.cover}" alt="${x.title}" loading="lazy"><div class="ci"><h3>${x.title}</h3><p>${x.tag}</p></div>`;$('grid').appendChild(c)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-id]');if(t)open(GAMES.find(x=>x.id===t.dataset.id));if(e.target===m||e.target.classList.contains('x'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Enter'&&e.target.dataset.id)open(GAMES.find(x=>x.id===e.target.dataset.id))});
function open(x){mb.innerHTML=`<p class="lbl">${x.tag}</p><h2>${x.title}</h2><div class="shots">${x.shots.map(s=>`<img src="${s}" alt="" loading="lazy">`).join('')}</div><p>${x.desc}</p>${acts(x)}`;m.hidden=false;document.body.style.overflow='hidden';history.replaceState(null,'','#'+x.id)}
function close(){if(m.hidden)return;m.hidden=true;document.body.style.overflow='';history.replaceState(null,'',location.pathname)}
GAMES.filter(x=>x.releaseApi).forEach(resolveDl);
const h=GAMES.find(x=>x.id===location.hash.slice(1));if(h)open(h);
(window.TOOLS||[]).forEach(t=>{const c=document.createElement('article');c.className='tool';c.innerHTML=`<a class="timg" href="${t.open}"><img src="${t.cover}" alt="${t.title}" loading="lazy"></a><div class="ttx"><h3>${t.title}</h3><p class="tag">${t.tag}</p><p>${t.desc}</p><div class="acts"><a class="btn" href="${t.open}">${t.openLabel||'Open'}</a></div></div>`;$('tgrid').appendChild(c)});
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('section,.card').forEach(el=>io.observe(el));
