const g=document.getElementById('grid'),m=document.getElementById('modal'),mb=document.getElementById('mbody');
document.getElementById('y').textContent=new Date().getFullYear();
const btns=x=>`<div class="acts">${x.play?`<a class="btn" target="_blank" href="${x.play}">▶ ${x.playLabel||'Play'}</a>`:''}${x.download?`<a class="btn alt" target="_blank" href="${x.download}">⬇ ${x.downloadLabel||'Download'}</a>`:''}</div>${x.platforms?`<small>${x.platforms}</small>`:''}`;
GAMES.forEach(x=>{const c=document.createElement('article');c.className='card';c.tabIndex=0;
 c.innerHTML=`<img src="${x.cover}" alt="${x.title}" loading="lazy"><div class="ci"><h3>${x.title}</h3><p>${x.tag}</p></div>`;
 c.onclick=c.onkeydown=e=>{if(e.type==='keydown'&&e.key!=='Enter')return;open(x)};g.appendChild(c)});
function open(x){mb.innerHTML=`<h2>${x.title}</h2><p class="tag">${x.tag}</p><div class="shots">${x.shots.map(s=>`<img src="${s}" alt="">`).join('')}</div><p>${x.desc}</p>${btns(x)}`;m.hidden=false;location.hash=x.id}
function close(){m.hidden=true;history.replaceState(null,'',location.pathname)}
m.onclick=e=>{if(e.target===m||e.target.classList.contains('x'))close()};document.onkeydown=e=>{if(e.key==='Escape')close()};
const h=GAMES.find(x=>x.id===location.hash.slice(1));if(h)open(h);
