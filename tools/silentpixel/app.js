'use strict';
const $=id=>document.getElementById(id);
const PALS={'PICO-8':['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'],
'NES-ish':['#000000','#fcfcfc','#bcbcbc','#7c7c7c','#a4e4fc','#3cbcfc','#0078f8','#0000fc','#b8b8f8','#6888fc','#0058f8','#0000bc','#d8b8f8','#9878f8','#6844fc','#4428bc','#f8b8f8','#f878f8','#d800cc','#940084','#f8a4c0','#f85898','#e40058','#a80020','#f0d0b0','#f87858','#f83800','#a81000','#fce0a8','#fca044','#e45c10','#881400','#f8d878','#f8b800','#ac7c00','#503000','#d8f878','#b8f818','#00b800','#007800','#58f898','#00a844','#005800','#00fcfc','#00e8d8','#008888','#004058'],
'Game Boy':['#0f380f','#306230','#8bac0f','#9bbc0f'],
'Grayscale':['#000000','#222222','#444444','#666666','#888888','#aaaaaa','#cccccc','#eeeeee','#ffffff'],
'Dead Silence':['#000000','#0a0a0b','#1c1c1f','#3a3a3f','#77777c','#c9c9cc','#ffffff','#3a0508','#8a0f1a','#b0001e','#e0203a']};
try{Object.assign(PALS,JSON.parse(localStorage.getItem('sp_pals')||'{}'))}catch(e){}
let P,cur={f:0,l:0},tool='pencil',color=[176,0,30,255],zoom=12,pan={x:0,y:0},grid=true,undoS=[],redoS=[],sel=null,playing=false;
const cv=$('cv'),cx=cv.getContext('2d');
function blank(){return new Uint8ClampedArray(P.w*P.h*4)}
function newProject(w,h){P={w,h,layers:[{name:'Layer 1',visible:true,opacity:1}],frames:[{dur:125,cels:[null]}]};P.frames[0].cels[0]=blank();cur={f:0,l:0};undoS=[];redoS=[];fit();refresh()}
const cel=(f=cur.f,l=cur.l)=>P.frames[f].cels[l];
function hex2rgba(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),255]}
const rgba2hex=c=>'#'+c.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
// ---- history
function snap(){return JSON.stringify(ser())}
function push(){undoS.push(snap());if(undoS.length>60)undoS.shift();redoS=[]}
function undo(){if(!undoS.length)return;redoS.push(snap());des(JSON.parse(undoS.pop()),true)}
function redo(){if(!redoS.length)return;undoS.push(snap());des(JSON.parse(redoS.pop()),true)}
function ser(){return{app:'Silent Pixel',version:1,w:P.w,h:P.h,fps:+$('fps').value,layers:P.layers,frames:P.frames.map(f=>({dur:f.dur,cels:f.cels.map(c=>b64(c))}))}}
function b64(a){let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)}
function unb64(s){const b=atob(s),a=new Uint8ClampedArray(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function des(o,keep){P={w:o.w,h:o.h,layers:o.layers,frames:o.frames.map(f=>({dur:f.dur,cels:f.cels.map(unb64)}))};if(o.fps)$('fps').value=o.fps;cur.f=Math.min(cur.f,P.frames.length-1);cur.l=Math.min(cur.l,P.layers.length-1);if(!keep){fit()}refresh()}
// ---- pixel ops
function setPx(a,x,y,c){if(x<0||y<0||x>=P.w||y>=P.h)return;const i=(y*P.w+x)*4;a[i]=c[0];a[i+1]=c[1];a[i+2]=c[2];a[i+3]=c[3]}
function getPx(a,x,y){const i=(y*P.w+x)*4;return[a[i],a[i+1],a[i+2],a[i+3]]}
function plot(x,y,c){const a=cel(),b=+$('brush').value,o=Math.floor((b-1)/2);const mx=$('mx').checked,my=$('my').checked;
 for(let dy=0;dy<b;dy++)for(let dx=0;dx<b;dx++){const X=x-o+dx,Y=y-o+dy;setPx(a,X,Y,c);if(mx)setPx(a,P.w-1-X,Y,c);if(my)setPx(a,X,P.h-1-Y,c);if(mx&&my)setPx(a,P.w-1-X,P.h-1-Y,c)}}
function line(x0,y0,x1,y1,c){let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;for(;;){plot(x0,y0,c);if(x0==x1&&y0==y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
function rect(x0,y0,x1,y1,c,f){const[a,b]=[Math.min(x0,x1),Math.max(x0,x1)],[d,e]=[Math.min(y0,y1),Math.max(y0,y1)];for(let y=d;y<=e;y++)for(let x=a;x<=b;x++)if(f||x==a||x==b||y==d||y==e)plot(x,y,c)}
function ellipse(x0,y0,x1,y1,c,f){const cx_=(x0+x1)/2,cy=(y0+y1)/2,rx=Math.abs(x1-x0)/2+.5,ry=Math.abs(y1-y0)/2+.5;const ins=(x,y)=>((x-cx_)/rx)**2+((y-cy)/ry)**2<=1;
 for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)if(ins(x,y)&&(f||!ins(x-1,y)||!ins(x+1,y)||!ins(x,y-1)||!ins(x,y+1)))plot(x,y,c)}
function fill(x,y,c){const a=cel(),t=getPx(a,x,y);if(t.every((v,i)=>v==c[i]))return;const st=[[x,y]];const eq=(X,Y)=>{const i=(Y*P.w+X)*4;return a[i]==t[0]&&a[i+1]==t[1]&&a[i+2]==t[2]&&a[i+3]==t[3]};
 while(st.length){const[X,Y]=st.pop();if(X<0||Y<0||X>=P.w||Y>=P.h||!eq(X,Y))continue;setPx(a,X,Y,c);st.push([X+1,Y],[X-1,Y],[X,Y+1],[X,Y-1])}}
// ---- compositing
function compose(f,ctx,s=1){const im=new ImageData(P.w,P.h),d=im.data;P.layers.forEach((L,li)=>{if(!L.visible)return;const a=P.frames[f].cels[li];for(let i=0;i<a.length;i+=4){const al=a[i+3]/255*L.opacity;if(!al)continue;const ba=d[i+3]/255,oa=al+ba*(1-al);for(let k=0;k<3;k++)d[i+k]=(a[i+k]*al+d[i+k]*ba*(1-al))/oa;d[i+3]=oa*255}});
 const t=document.createElement('canvas');t.width=P.w;t.height=P.h;t.getContext('2d').putImageData(im,0,0);if(ctx){ctx.imageSmoothingEnabled=false;ctx.drawImage(t,0,0,P.w*s,P.h*s)}return t}
let preview=null;
function draw(){const r=cv.getBoundingClientRect();if(cv.width!=r.width||cv.height!=r.height){cv.width=r.width;cv.height=r.height}
 cx.fillStyle='#050506';cx.fillRect(0,0,cv.width,cv.height);cx.imageSmoothingEnabled=false;const ox=pan.x,oy=pan.y,W=P.w*zoom,H=P.h*zoom;
 for(let y=0;y<P.h;y+=1)for(let x=0;x<P.w;x+=1){cx.fillStyle=(x+y)&1?'#1a1a1d':'#141416';cx.fillRect(ox+x*zoom,oy+y*zoom,zoom,zoom)}
 const on=(f,al)=>{if(f<0||f>=P.frames.length)return;cx.globalAlpha=al;cx.drawImage(compose(f),ox,oy,W,H);cx.globalAlpha=1};
 if(!playing){if($('onPrev').checked)on(cur.f-1,.3);if($('onNext').checked)on(cur.f+1,.3)}
 cx.drawImage(compose(cur.f),ox,oy,W,H);
 if(preview){cx.drawImage(preview,ox,oy,W,H)}
 if(grid&&zoom>=4){cx.strokeStyle='rgba(255,255,255,.06)';cx.beginPath();for(let x=0;x<=P.w;x++){cx.moveTo(ox+x*zoom+.5,oy);cx.lineTo(ox+x*zoom+.5,oy+H)}for(let y=0;y<=P.h;y++){cx.moveTo(ox,oy+y*zoom+.5);cx.lineTo(ox+W,oy+y*zoom+.5)}cx.stroke()}
 cx.strokeStyle='#26262a';cx.strokeRect(ox-.5,oy-.5,W+1,H+1);
 if(sel){cx.setLineDash([4,3]);cx.strokeStyle='#e0203a';cx.strokeRect(ox+sel.x*zoom+.5,oy+sel.y*zoom+.5,sel.w*zoom,sel.h*zoom);cx.setLineDash([])}
 const pv=$('pv'),pc=pv.getContext('2d');pc.clearRect(0,0,128,128);const s=128/Math.max(P.w,P.h);pc.imageSmoothingEnabled=false;pc.drawImage(compose(cur.f),0,0,P.w*s,P.h*s);
 $('info').textContent=`${P.w}×${P.h} · ${zoom*100/1|0}% · frame ${cur.f+1}/${P.frames.length} · ${tool.toUpperCase()}`}
function fit(){const r=$('stage').getBoundingClientRect();zoom=Math.max(1,Math.floor(Math.min((r.width-40)/P.w,(r.height-40)/P.h)));pan={x:(r.width-P.w*zoom)/2|0,y:(r.height-P.h*zoom)/2|0}}
// ---- input
let drag=null,spaceDown=false;
const toPx=e=>{const r=cv.getBoundingClientRect();return[Math.floor((e.clientX-r.left-pan.x)/zoom),Math.floor((e.clientY-r.top-pan.y)/zoom)]};
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);if(e.button==1||spaceDown){drag={pan:1,sx:e.clientX-pan.x,sy:e.clientY-pan.y};return}
 const[x,y]=toPx(e),t=e.button==2?'eraser':tool,c=t=='eraser'?[0,0,0,0]:color;
 if(t=='picker'){if(x>=0&&y>=0&&x<P.w&&y<P.h){const p=getPx(compose(cur.f).getContext('2d').getImageData(0,0,P.w,P.h).data,x,y);if(p[3]){color=p;$('color').value=rgba2hex(p);renderPal()}}return}
 if(t=='select'){if(sel&&x>=sel.x&&y>=sel.y&&x<sel.x+sel.w&&y<sel.y+sel.h){push();const a=cel(),buf=[];for(let j=0;j<sel.h;j++)for(let i=0;i<sel.w;i++){const X=sel.x+i,Y=sel.y+j;if(X<0||Y<0||X>=P.w||Y>=P.h){buf.push(null);continue}buf.push(getPx(a,X,Y));setPx(a,X,Y,[0,0,0,0])}
  drag={move:1,x0:x,y0:y,buf,base:a.slice(),sx:sel.x,sy:sel.y}}else{sel=null;drag={sel:1,x0:x,y0:y}}draw();return}
 push();if(t=='fill'){if(x>=0&&y>=0&&x<P.w&&y<P.h)fill(x,y,c);refresh();return}
 drag={t,c,x0:x,y0:y,lx:x,ly:y,base:cel().slice()};if(t=='pencil'||t=='eraser')plot(x,y,c);draw()});
cv.addEventListener('pointermove',e=>{if(!drag)return;if(drag.pan){pan.x=e.clientX-drag.sx;pan.y=e.clientY-drag.sy;draw();return}const[x,y]=toPx(e);
 if(drag.sel){sel={x:Math.min(x,drag.x0),y:Math.min(y,drag.y0),w:Math.abs(x-drag.x0)+1,h:Math.abs(y-drag.y0)+1};draw();return}
 if(drag.move){const a=cel();a.set(drag.base);sel.x=drag.sx+x-drag.x0;sel.y=drag.sy+y-drag.y0;let k=0;for(let j=0;j<sel.h;j++)for(let i=0;i<sel.w;i++){const p=drag.buf[k++];if(p&&p[3])setPx(a,sel.x+i,sel.y+j,p)}draw();return}
 if(drag.t=='pencil'||drag.t=='eraser'){line(drag.lx,drag.ly,x,y,drag.c);drag.lx=x;drag.ly=y}
 else{cel().set(drag.base);const f=$('filled').checked;({line:()=>line(drag.x0,drag.y0,x,y,drag.c),rect:()=>rect(drag.x0,drag.y0,x,y,drag.c,f),ellipse:()=>ellipse(drag.x0,drag.y0,x,y,drag.c,f)})[drag.t]()}draw()});
cv.addEventListener('pointerup',()=>{if(drag&&!drag.pan&&!drag.sel)refresh();drag=null});
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,nz=Math.max(1,Math.min(64,zoom*(e.deltaY<0?1.25:.8)|0||1));if(nz==zoom&&e.deltaY<0)return;
 pan.x=mx-(mx-pan.x)*nz/zoom;pan.y=my-(my-pan.y)*nz/zoom;zoom=nz;draw()},{passive:false});
// ---- UI
function setTool(t){tool=t;if(t!='select')sel=null;document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==t));draw()}
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>setTool(b.dataset.t));
document.querySelectorAll('[data-sz]').forEach(b=>b.onclick=()=>{$('cw').value=$('ch').value=b.dataset.sz;newProject(+b.dataset.sz,+b.dataset.sz)});
$('resize').onclick=()=>{const w=Math.max(8,Math.min(256,+$('cw').value|0)),h=Math.max(8,Math.min(256,+$('ch').value|0));push();const ow=P.w,oh=P.h;P.frames.forEach(f=>f.cels=f.cels.map(a=>{const n=new Uint8ClampedArray(w*h*4);for(let y=0;y<Math.min(h,oh);y++)n.set(a.subarray(y*ow*4,(y*ow+Math.min(w,ow))*4),y*w*4);return n}));P.w=w;P.h=h;fit();refresh()};
$('grid').onclick=()=>{grid=!grid;$('grid').classList.toggle('on',grid);draw()};$('undo').onclick=undo;$('redo').onclick=redo;
$('brush').oninput=()=>$('bv').textContent=$('brush').value;
$('color').oninput=()=>{color=hex2rgba($('color').value);renderPal()};
['onPrev','onNext'].forEach(i=>$(i).onchange=draw);
function renderPal(){const p=PALS[$('palSel').value]||[];$('pal').innerHTML='';p.forEach(h=>{const d=document.createElement('div');d.style.background=h;d.title=h;if(h==rgba2hex(color))d.className='sel';d.onclick=()=>{color=hex2rgba(h);$('color').value=h;renderPal()};$('pal').appendChild(d)})}
function renderPalSel(v){$('palSel').innerHTML=Object.keys(PALS).map(k=>`<option>${k}</option>`).join('');$('palSel').value=v||'Dead Silence';renderPal()}
$('palSel').onchange=renderPal;
$('addCol').onclick=()=>{let n=$('palSel').value;if(!n.startsWith('Custom')){n='Custom';PALS[n]=PALS[n]||[]}const h=rgba2hex(color);if(!PALS[n].includes(h))PALS[n].push(h);renderPalSel(n)};
$('savePal').onclick=()=>{const n=prompt('Palette name','Custom '+Date.now()%1000);if(!n)return;PALS[n]=[...(PALS[$('palSel').value]||[])];const c={};for(const k in PALS)if(!['PICO-8','NES-ish','Game Boy','Grayscale','Dead Silence'].includes(k))c[k]=PALS[k];localStorage.setItem('sp_pals',JSON.stringify(c));renderPalSel(n)};
// layers
function renderLayers(){const el=$('layers');el.innerHTML='';P.layers.map((L,i)=>[L,i]).reverse().forEach(([L,i])=>{const d=document.createElement('div');d.className=i==cur.l?'sel':'';d.innerHTML=`<input type="checkbox" ${L.visible?'checked':''}><span>${L.name}</span>`;
 d.onclick=()=>{cur.l=i;refresh()};d.ondblclick=()=>{const n=prompt('Layer name',L.name);if(n){L.name=n;refresh()}};const cb=d.querySelector('input');cb.onclick=e=>{e.stopPropagation();L.visible=cb.checked;draw();renderFrames()};el.appendChild(d)});$('lOp').value=P.layers[cur.l].opacity}
$('lOp').oninput=()=>{P.layers[cur.l].opacity=+$('lOp').value;draw()};$('lOp').onchange=renderFrames;
$('lAdd').onclick=()=>{push();P.layers.splice(cur.l+1,0,{name:'Layer '+(P.layers.length+1),visible:true,opacity:1});P.frames.forEach(f=>f.cels.splice(cur.l+1,0,blank()));cur.l++;refresh()};
$('lDel').onclick=()=>{if(P.layers.length<2)return;push();P.layers.splice(cur.l,1);P.frames.forEach(f=>f.cels.splice(cur.l,1));cur.l=Math.max(0,cur.l-1);refresh()};
const mvL=d=>{const j=cur.l+d;if(j<0||j>=P.layers.length)return;push();const sw=a=>{[a[cur.l],a[j]]=[a[j],a[cur.l]]};sw(P.layers);P.frames.forEach(f=>sw(f.cels));cur.l=j;refresh()};
$('lUp').onclick=()=>mvL(1);$('lDn').onclick=()=>mvL(-1);
// frames
function renderFrames(){const el=$('frames');el.innerHTML='';P.frames.forEach((f,i)=>{const c=document.createElement('canvas');c.width=P.w;c.height=P.h;c.getContext('2d').drawImage(compose(i),0,0);c.className=i==cur.f?'sel':'';c.title='Frame '+(i+1);c.onclick=()=>{cur.f=i;refresh()};el.appendChild(c)})}
$('fAdd').onclick=()=>{push();P.frames.splice(cur.f+1,0,{dur:P.frames[cur.f].dur,cels:P.layers.map(blank)});cur.f++;refresh()};
$('fDup').onclick=()=>{push();P.frames.splice(cur.f+1,0,{dur:P.frames[cur.f].dur,cels:P.frames[cur.f].cels.map(a=>a.slice())});cur.f++;refresh()};
$('fDel').onclick=()=>{if(P.frames.length<2)return;push();P.frames.splice(cur.f,1);cur.f=Math.max(0,cur.f-1);refresh()};
const mvF=d=>{const j=cur.f+d;if(j<0||j>=P.frames.length)return;push();[P.frames[cur.f],P.frames[j]]=[P.frames[j],P.frames[cur.f]];cur.f=j;refresh()};
$('fL').onclick=()=>mvF(-1);$('fR').onclick=()=>mvF(1);
let timer=null,dir=1;
function togglePlay(){playing=!playing;$('play').textContent=playing?'■ Stop':'▶ Play';$('play').classList.toggle('on',playing);clearTimeout(timer);if(playing)tick();else refresh()}
function tick(){if(!playing)return;const n=P.frames.length;if(n>1){if($('mode').value=='ping'){if(cur.f+dir>=n||cur.f+dir<0)dir=-dir;cur.f+=dir}else cur.f=(cur.f+1)%n}draw();timer=setTimeout(tick,1000/Math.max(1,+$('fps').value))}
$('play').onclick=togglePlay;
function refresh(){renderLayers();renderFrames();draw()}
// ---- save/load/export
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
$('save').onclick=()=>dl(new Blob([JSON.stringify(ser())],{type:'application/json'}),'silentpixel-project.json');
$('loadBtn').onclick=()=>$('load').click();$('load').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{push();des(JSON.parse(t))});e.target.value=''};
const S=()=>+$('scale').value;
function scaled(f){const s=S(),c=document.createElement('canvas');c.width=P.w*s;c.height=P.h*s;compose(f,c.getContext('2d'),s);return c}
const toBlob=c=>new Promise(r=>c.toBlob(r,'image/png'));
$('exPng').onclick=async()=>dl(await toBlob(scaled(cur.f)),`silentpixel-frame${cur.f+1}.png`);
function sheet(){const s=S(),n=P.frames.length,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),fw=P.w*s,fh=P.h*s,c=document.createElement('canvas');c.width=cols*fw;c.height=rows*fh;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const frames={};
 P.frames.forEach((f,i)=>{const x=(i%cols)*fw,y=(i/cols|0)*fh;g.drawImage(scaled(i),x,y);frames[`silentpixel ${i}.png`]={frame:{x,y,w:fw,h:fh},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:fw,h:fh},sourceSize:{w:fw,h:fh},duration:Math.round(1000/+$('fps').value)}});
 const meta={app:'Silent Pixel — DEAD SILENCE Studios',version:'1.0',image:'silentpixel-sheet.png',format:'RGBA8888',size:{w:c.width,h:c.height},scale:String(s),frameTags:[{name:'anim',from:0,to:n-1,direction:$('mode').value=='ping'?'pingpong':'forward'}],layers:P.layers.map(l=>({name:l.name,opacity:Math.round(l.opacity*255),blendMode:'normal'}))};
 return{c,json:{frames,meta}}}
$('exSheet').onclick=async()=>{const{c,json}=sheet();dl(await toBlob(c),'silentpixel-sheet.png');setTimeout(()=>dl(new Blob([JSON.stringify(json,null,1)],{type:'application/json'}),'silentpixel-sheet.json'),300)};
// GIF encoder
function gif(frames,w,h,delay,ping){const order=[...frames.keys()];if(ping&&frames.length>2)for(let i=frames.length-2;i>0;i--)order.push(i);
 const cmap=new Map(),pal=[[0,0,0]];const idx=frames.map(d=>{const o=new Uint8Array(w*h);for(let p=0;p<w*h;p++){const i=p*4;if(d[i+3]<128){o[p]=0;continue}let r=d[i],g=d[i+1],b=d[i+2];let k=(r<<16)|(g<<8)|b;if(!cmap.has(k)){if(pal.length<256){cmap.set(k,pal.length);pal.push([r,g,b])}else{let best=1,bd=1e9;for(let j=1;j<pal.length;j++){const q=pal[j],dd=(q[0]-r)**2+(q[1]-g)**2+(q[2]-b)**2;if(dd<bd){bd=dd;best=j}}cmap.set(k,best)}}o[p]=cmap.get(k)}return o});
 const out=[],B=v=>out.push(v&255),W16=v=>{B(v);B(v>>8)};'GIF89a'.split('').forEach(c=>B(c.charCodeAt(0)));W16(w);W16(h);B(0xF7);B(0);B(0);for(let i=0;i<256;i++){const c=pal[i]||[0,0,0];B(c[0]);B(c[1]);B(c[2])}
 [0x21,0xFF,11,...'NETSCAPE2.0'.split('').map(c=>c.charCodeAt(0)),3,1,0,0,0].forEach(B);
 for(const fi of order){B(0x21);B(0xF9);B(4);B(0x09);W16(delay);B(0);B(0);B(0x2C);W16(0);W16(0);W16(w);W16(h);B(0);B(8);
  const px=idx[fi],bytes=[];let cur_=0,nb=0;const emit=(c,sz)=>{cur_|=c<<nb;nb+=sz;while(nb>=8){bytes.push(cur_&255);cur_>>=8;nb-=8}};
  const CLR=256,EOI=257;let dict=new Map(),next=258,size=9;emit(CLR,size);let pre=px[0];
  for(let i=1;i<px.length;i++){const k=pre*256+px[i];if(dict.has(k)){pre=dict.get(k);continue}emit(pre,size);if(next<4096){dict.set(k,next++);if(next>(1<<size)&&size<12)size++}else{emit(CLR,size);dict=new Map();next=258;size=9}pre=px[i]}
  emit(pre,size);emit(EOI,size);if(nb>0)bytes.push(cur_&255);for(let i=0;i<bytes.length;i+=255){const ch=bytes.slice(i,i+255);B(ch.length);ch.forEach(B)}B(0)}
 B(0x3B);return new Uint8Array(out)}
$('exGif').onclick=()=>{const s=S(),w=P.w*s,h=P.h*s;const fr=P.frames.map((_,i)=>scaled(i).getContext('2d').getImageData(0,0,w,h).data);dl(new Blob([gif(fr,w,h,Math.round(100/+$('fps').value),$('mode').value=='ping')],{type:'image/gif'}),'silentpixel-anim.gif')};
// store-only ZIP
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c}return d=>{let c=~0;for(let i=0;i<d.length;i++)c=t[(c^d[i])&255]^(c>>>8);return~c>>>0}})();
function zip(files){const parts=[],cen=[];let off=0;const u16=v=>[v&255,v>>8&255],u32=v=>[v&255,v>>8&255,v>>16&255,v>>>24];
 for(const f of files){const nm=new TextEncoder().encode(f.name),crc=CRC(f.data),sz=f.data.length;const h=new Uint8Array([0x50,0x4b,3,4,...u16(20),0,0,0,0,0,0,0,0,...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),0,0]);parts.push(h,nm,f.data);
  cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),0,0,0,0,0,0,0,0,...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(off)]),nm);off+=h.length+nm.length+sz}
 const cl=cen.reduce((a,b)=>a+b.length,0);return new Blob([...parts,...cen,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cl),...u32(off),0,0])],{type:'application/zip'})}
$('exZip').onclick=async()=>{const files=[];for(let i=0;i<P.frames.length;i++)files.push({name:`silentpixel_${String(i).padStart(3,'0')}.png`,data:new Uint8Array(await (await toBlob(scaled(i))).arrayBuffer())});dl(zip(files),'silentpixel-frames.zip')};
// keys
const KT={b:'pencil',e:'eraser',f:'fill',l:'line',r:'rect',o:'ellipse',i:'picker',m:'select'};
window.addEventListener('keydown',e=>{if(e.target.tagName=='INPUT'&&e.target.type!='range'&&e.target.type!='checkbox')return;const k=e.key.toLowerCase();
 if(e.ctrlKey||e.metaKey){if(k=='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k=='y'){e.preventDefault();redo()}else if(k=='s'){e.preventDefault();$('save').click()}return}
 if(k==' '){spaceDown=true;e.preventDefault();return}if(KT[k])setTool(KT[k]);else if(k=='x')$('mx').click();else if(k=='y')$('my').click();else if(k=='g')$('grid').click();
 else if(k=='[')($('brush').value--,$('bv').textContent=$('brush').value);else if(k==']')($('brush').value++,$('bv').textContent=$('brush').value);
 else if(k==','){cur.f=Math.max(0,cur.f-1);refresh()}else if(k=='.'){cur.f=Math.min(P.frames.length-1,cur.f+1);refresh()}else if(k=='enter')togglePlay();
 else if(k=='delete'&&sel){push();const a=cel();for(let j=0;j<sel.h;j++)for(let i=0;i<sel.w;i++)setPx(a,sel.x+i,sel.y+j,[0,0,0,0]);refresh()}});
window.addEventListener('keyup',e=>{if(e.key==' ')spaceDown=false});
window.addEventListener('resize',draw);
function hideSplash(){const s=$('splash');if(s&&!s.classList.contains('out')){s.classList.add('out');setTimeout(()=>s.remove(),700)}}
$('splash').onclick=hideSplash;window.addEventListener('keydown',hideSplash,{once:true});setTimeout(hideSplash,2000);
renderPalSel();newProject(32,32);setTool('pencil');
window.SP={get P(){return P},plot,line,rect,ellipse,fill,refresh,gif,zip,sheet,ser,des,compose,push,undo,cur};
