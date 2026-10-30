const $=id=>document.getElementById(id),m=$('modal'),mb=$('mbody');$('y').textContent=new Date().getFullYear();
const acts=x=>`<div class="acts">${x.play?`<a class="btn" target="_blank" rel="noopener" href="${x.play}">${x.playLabel||'Play'}</a>`:''}${x.download?`<a class="btn ghost" data-dl="${x.id}" href="${x.dlUrl||x.download}" download>${x.dlLabel||x.downloadLabel||'Download'}</a>`:''}</div>${x.others&&x.others.length?`<small class="oth">Other platforms: ${x.others.map(o=>`<a href="${o.url}" download>${o.os}</a>`).join(' · ')}</small>`:''}`;
const OS=/Mac/i.test(navigator.platform+navigator.userAgent)&&!/iPhone|iPad/.test(navigator.userAgent)?'mac':/Linux|X11/.test(navigator.userAgent)&&!/Android/.test(navigator.userAgent)?'linux':'win';
const EXT={win:[/\.exe$/i,'Windows'],mac:[/\.dmg$/i,'Mac'],linux:[/\.AppImage$/i,'Linux']};
function resolveDl(x){fetch(x.releaseApi).then(r=>r.json()).then(r=>{const as=r.assets||[],f={};
 for(const k in EXT){const a=as.find(a=>EXT[k][0].test(a.name));if(a)f[k]=a.browser_download_url}
 if(!f.win&&!f.mac&&!f.linux)return;const k=f[OS]?OS:(f.win?'win':Object.keys(f)[0]);
 x.dlUrl=f[k];x.dlLabel='Download for '+EXT[k][1];x.others=Object.keys(f).filter(o=>o!==k).map(o=>({os:EXT[o][1],url:f[o]}));
 document.querySelectorAll(`[data-dl="${x.id}"]`).forEach(b=>{b.href=x.dlUrl;b.textContent=x.dlLabel;const p=b.parentNode,n=p.nextElementSibling;if(n&&n.classList.contains('oth'))n.remove();
  if(x.others.length)p.insertAdjacentHTML('afterend',`<small class="oth">Other platforms: ${x.others.map(o=>`<a href="${o.url}" download>${o.os}</a>`).join(' · ')}</small>`)})}).catch(()=>{})}
const f=GAMES.find(x=>x.featured);
if(f)$('featured').innerHTML=`<div class="fimg"><img src="${f.cover}" alt="${f.title}"></div><div class="ftx"><h2 class="lbl">Featured</h2><h3>${f.title}</h3><p class="tag">${f.tag}</p><p>${f.desc}</p>${acts(f)}<button class="ln more" data-id="${f.id}">View details →</button></div>`;
GAMES.filter(x=>x!==f).forEach(x=>{const c=document.createElement('article');c.className='card';c.tabIndex=0;c.dataset.id=x.id;
 c.innerHTML=`<img src="${x.cover}" alt="${x.title}" loading="lazy"><div class="ci"><h3>${x.title}</h3><p>${x.tag}</p></div>`;$('grid').appendChild(c)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-id]');if(t)open(GAMES.find(x=>x.id===t.dataset.id));if(e.target===m||e.target.classList.contains('x'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Enter'&&e.target.dataset.id)open(GAMES.find(x=>x.id===e.target.dataset.id))});
function open(x){mb.innerHTML=`<p class="lbl">${x.tag}</p><h2>${x.title}</h2><div class="shots">${x.shots.map(s=>`<img src="${s}" alt="" loading="lazy">`).join('')}</div><p>${x.desc}</p>${acts(x)}`;m.hidden=false;document.body.style.overflow='hidden';history.replaceState(null,'','#'+x.id)}
function close(){if(m.hidden)return;m.hidden=true;document.body.style.overflow='';history.replaceState(null,'',location.pathname)}
GAMES.filter(x=>x.releaseApi).forEach(resolveDl);
const h=GAMES.find(x=>x.id===location.hash.slice(1));if(h)open(h);
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('section,.card').forEach(el=>io.observe(el));
