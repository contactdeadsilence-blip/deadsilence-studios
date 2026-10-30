const $=id=>document.getElementById(id),m=$('modal'),mb=$('mbody');$('y').textContent=new Date().getFullYear();
const acts=x=>`<div class="acts">${x.play?`<a class="btn" target="_blank" rel="noopener" href="${x.play}">${x.playLabel||'Play'}</a>`:''}${x.download?`<a class="btn ghost" target="_blank" rel="noopener" href="${x.download}">${x.downloadLabel||'Download'}</a>`:''}</div>${x.platforms?`<small>${x.platforms}</small>`:''}`;
const f=GAMES.find(x=>x.featured);
if(f)$('featured').innerHTML=`<div class="fimg"><img src="${f.cover}" alt="${f.title}"></div><div class="ftx"><h2 class="lbl">Featured</h2><h3>${f.title}</h3><p class="tag">${f.tag}</p><p>${f.desc}</p>${acts(f)}<button class="ln more" data-id="${f.id}">View details →</button></div>`;
GAMES.filter(x=>x!==f).forEach(x=>{const c=document.createElement('article');c.className='card';c.tabIndex=0;c.dataset.id=x.id;
 c.innerHTML=`<img src="${x.cover}" alt="${x.title}" loading="lazy"><div class="ci"><h3>${x.title}</h3><p>${x.tag}</p></div>`;$('grid').appendChild(c)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-id]');if(t)open(GAMES.find(x=>x.id===t.dataset.id));if(e.target===m||e.target.classList.contains('x'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Enter'&&e.target.dataset.id)open(GAMES.find(x=>x.id===e.target.dataset.id))});
function open(x){mb.innerHTML=`<p class="lbl">${x.tag}</p><h2>${x.title}</h2><div class="shots">${x.shots.map(s=>`<img src="${s}" alt="" loading="lazy">`).join('')}</div><p>${x.desc}</p>${acts(x)}`;m.hidden=false;document.body.style.overflow='hidden';history.replaceState(null,'','#'+x.id)}
function close(){if(m.hidden)return;m.hidden=true;document.body.style.overflow='';history.replaceState(null,'',location.pathname)}
const h=GAMES.find(x=>x.id===location.hash.slice(1));if(h)open(h);
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('section,.card').forEach(el=>io.observe(el));
