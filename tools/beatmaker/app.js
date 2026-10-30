'use strict';
const PRESETS={
 saw:{name:'Saw Lead',w:'sawtooth',v:2,det:12,a:.005,d:.2,s:.6,r:.2,cutoff:4000,q:4,oct:0},
 square:{name:'Square',w:'square',v:1,det:0,a:.005,d:.1,s:.7,r:.1,cutoff:5000,q:1,oct:0},
 bass:{name:'Bass',w:'sawtooth',v:2,det:5,a:.003,d:.25,s:.4,r:.1,cutoff:700,q:8,oct:-1},
 pad:{name:'Pad',w:'sawtooth',v:3,det:15,a:.6,d:.5,s:.7,r:1.2,cutoff:2200,q:1,oct:0},
 pulse:{name:'Pulse 25%',w:'pulse',v:1,det:0,a:.001,d:.05,s:.8,r:.03,cutoff:12000,q:0,oct:0},
 chipsq:{name:'Chip Square',w:'square',v:1,det:0,a:.001,d:.05,s:.8,r:.03,cutoff:12000,q:0,oct:0},
 tri:{name:'Triangle',w:'triangle',v:1,det:0,a:.001,d:.05,s:.9,r:.03,cutoff:12000,q:0,oct:0},
 noise:{name:'Noise',w:'noise',v:1,det:0,a:.001,d:.12,s:.2,r:.05,cutoff:9000,q:0,oct:0},
 darkpad:{name:'Dark Pad',w:'sawtooth',v:3,det:25,a:1.5,d:1,s:.8,r:2.5,cutoff:600,q:3,oct:-1},
 drone:{name:'Drone',w:'drone',v:2,det:7,a:2,d:1,s:1,r:3,cutoff:900,q:6,oct:-2},
 bell:{name:'Eerie Bell',w:'bell',v:1,det:0,a:.002,d:1.8,s:0,r:1.8,cutoff:8000,q:0,oct:0}
};
const DRUMS=['kick','snare','clap','hihat','openhat'];
const NSTEPS=16,LOW=36,HIGH=83;
let P,sel=0,ctx,master,playing=false,curStep=0,nextTime=0,timer,noiseBuf,pulseWave;
const $=id=>document.getElementById(id);
function newCh(type,kind){const c={name:type==='drum'?kind.toUpperCase():PRESETS[kind].name,type,kind,vol:.8,pan:0,mute:false,solo:false,steps:Array(NSTEPS).fill(false),notes:[]};if(type==='synth')c.syn={...PRESETS[kind]};return c}
function defaultProject(){const p={bpm:128,swing:0,master:.8,channels:DRUMS.map(d=>newCh('drum',d)).concat([newCh('synth','bass'),newCh('synth','saw'),newCh('synth','darkpad')])};
 [0,4,8,12].forEach(i=>p.channels[0].steps[i]=true);[4,12].forEach(i=>p.channels[1].steps[i]=true);[2,6,10,14].forEach(i=>p.channels[3].steps[i]=true);
 [[0,36,2],[3,36,1],[6,39,2],[10,43,2],[14,41,2]].forEach(([s,n,l])=>p.channels[5].notes.push({step:s,pitch:n+12,len:l}));return p}
// ---------- audio ----------
function ensureCtx(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.connect(ctx.destination)}master.gain.value=P.master;if(ctx.state==='suspended')ctx.resume()}
function getNoise(c){const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function pulse(c){const n=64,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*.25);return c.createPeriodicWave(re,im)}
const caches=new WeakMap();
function res(c){let r=caches.get(c);if(!r){r={noise:getNoise(c),pulse:pulse(c)};caches.set(c,r)}return r}
function noiseSrc(c){const s=c.createBufferSource();s.buffer=res(c).noise;return s}
function env(g,t,peak,dec){g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(.001,t+dec)}
function drum(c,out,kind,t){const g=c.createGain();g.connect(out);
 if(kind==='kick'){const o=c.createOscillator();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);env(g,t,1,.45);o.connect(g);o.start(t);o.stop(t+.5)}
 else if(kind==='snare'){const n=noiseSrc(c),f=c.createBiquadFilter();f.type='highpass';f.frequency.value=1200;n.connect(f).connect(g);env(g,t,.7,.18);n.start(t);n.stop(t+.2);
  const o=c.createOscillator(),g2=c.createGain();o.frequency.value=190;o.connect(g2).connect(out);env(g2,t,.5,.1);o.start(t);o.stop(t+.12)}
 else if(kind==='clap'){const n=noiseSrc(c),f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1500;f.Q.value=1;n.connect(f).connect(g);
  g.gain.setValueAtTime(0,t);[0,.01,.02].forEach(o=>{g.gain.setValueAtTime(.8,t+o);g.gain.exponentialRampToValueAtTime(.1,t+o+.009)});g.gain.setValueAtTime(.6,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.2);n.start(t);n.stop(t+.25)}
 else{const open=kind==='openhat',n=noiseSrc(c),f=c.createBiquadFilter();f.type='highpass';f.frequency.value=7000;n.connect(f).connect(g);env(g,t,.4,open?.35:.05);n.start(t);n.stop(t+(open?.4:.07))}}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function synth(c,out,S,t,pitch,dur){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=S.cutoff;f.Q.value=S.q;const g=c.createGain();f.connect(g).connect(out);
 const fr=mtof(pitch+12*S.oct),end=t+dur,stopT=end+S.r+.05,srcs=[];
 if(S.w==='noise'){const n=noiseSrc(c);n.playbackRate.value=Math.min(4,fr/440);srcs.push(n)}
 else if(S.w==='bell'){[[1,1],[2.76,.5],[5.4,.25],[8.93,.1]].forEach(([m,a])=>{const o=c.createOscillator(),og=c.createGain();o.frequency.value=fr*m;o.detune.value=Math.random()*8-4;og.gain.value=a;o.connect(og).connect(f);srcs.push({start:x=>o.start(x),stop:x=>o.stop(x)})})}
 else{const w=S.w==='drone'?'sawtooth':S.w;for(let i=0;i<S.v;i++){const o=c.createOscillator();if(w==='pulse')o.setPeriodicWave(res(c).pulse);else o.type=w;o.frequency.value=fr;o.detune.value=S.v>1?(i/(S.v-1)-.5)*2*S.det:0;o.connect(f);srcs.push(o)}
  if(S.w==='drone'){const sub=c.createOscillator();sub.type='sine';sub.frequency.value=fr/2;sub.connect(f);srcs.push(sub);const l=c.createOscillator(),lg=c.createGain();l.frequency.value=.3;lg.gain.value=S.cutoff*.6;l.connect(lg).connect(f.frequency);srcs.push(l)}}
 const pk=S.w==='noise'?.5:.35/Math.sqrt(S.v);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+S.a);g.gain.linearRampToValueAtTime(pk*S.s+1e-4,t+S.a+S.d);
 g.gain.setValueAtTime(pk*S.s+1e-4,Math.max(end,t+S.a+S.d));g.gain.exponentialRampToValueAtTime(1e-4,Math.max(end,t+S.a+S.d)+S.r);
 srcs.forEach(s=>{s.start(t);s.stop(stopT+S.a+S.d)})}
function chOuts(c,dest){const anySolo=P.channels.some(x=>x.solo);return P.channels.map(ch=>{const g=c.createGain(),p=c.createStereoPanner();g.gain.value=(ch.mute||(anySolo&&!ch.solo))?0:ch.vol;p.pan.value=ch.pan;g.connect(p).connect(dest);return g})}
const stepDur=()=>60/P.bpm/4;
function stepTime(base,i){return base+i*stepDur()+(i%2?P.swing*stepDur():0)}
function scheduleStep(c,outs,i,t){P.channels.forEach((ch,k)=>{if(ch.type==='drum'){if(ch.steps[i])drum(c,outs[k],ch.kind,t)}else ch.notes.forEach(n=>{if(n.step===i)synth(c,outs[k],ch.syn,t,n.pitch,n.len*stepDur())})})}
let liveOuts;
function rebuildOuts(){if(!ctx)return;if(liveOuts)liveOuts.forEach(g=>setTimeout(()=>g.disconnect(),4000));liveOuts=chOuts(ctx,master)}
function tick(){while(nextTime<ctx.currentTime+.12){const t=nextTime+(curStep%2?P.swing*stepDur():0);scheduleStep(ctx,liveOuts,curStep,t);const s=curStep;setTimeout(()=>showStep(s),Math.max(0,(t-ctx.currentTime)*1000));nextTime+=stepDur();curStep=(curStep+1)%NSTEPS}}
function play(){ensureCtx();if(playing)return;rebuildOuts();playing=true;curStep=0;nextTime=ctx.currentTime+.05;timer=setInterval(tick,25);tick();$('play').classList.add('on')}
function stop(){playing=false;clearInterval(timer);$('play').classList.remove('on');showStep(-1)}
function toggle(){playing?stop():play()}
// ---------- export ----------
async function renderBuffer(){const loops=Math.max(1,+$('loops').value||1),sr=44100,len=loops*NSTEPS*stepDur()+4;
 const c=new OfflineAudioContext(2,Math.ceil(len*sr),sr),m=c.createGain();m.gain.value=P.master;m.connect(c.destination);const outs=chOuts(c,m);
 for(let L=0;L<loops;L++)for(let i=0;i<NSTEPS;i++)scheduleStep(c,outs,i,stepTime(L*NSTEPS*stepDur(),i));return c.startRendering()}
function wav(buf){const ch=buf.numberOfChannels,n=buf.length,b=new ArrayBuffer(44+n*ch*2),v=new DataView(b);let o=0;const w=s=>{for(const x of s)v.setUint8(o++,x.charCodeAt(0))},u32=x=>{v.setUint32(o,x,true);o+=4},u16=x=>{v.setUint16(o,x,true);o+=2};
 w('RIFF');u32(36+n*ch*2);w('WAVE');w('fmt ');u32(16);u16(1);u16(ch);u32(buf.sampleRate);u32(buf.sampleRate*ch*2);u16(ch*2);u16(16);w('data');u32(n*ch*2);
 const d=[...Array(ch)].map((_,i)=>buf.getChannelData(i));for(let i=0;i<n;i++)for(let k=0;k<ch;k++){const s=Math.max(-1,Math.min(1,d[k][i]));v.setInt16(o,s<0?s*0x8000:s*0x7fff,true);o+=2}return new Blob([b],{type:'audio/wav'})}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
async function exportWav(){const b=$('export');b.textContent='Rendering…';try{download(wav(await renderBuffer()),'deadsilence-beat.wav')}finally{b.textContent='Export WAV'}}
async function exportOgg(){const b=$('exportOgg');const types=['audio/ogg;codecs=opus','audio/webm;codecs=opus','audio/webm'];const mt=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));if(!mt){alert('Compressed export not supported in this browser — use WAV.');return}
 b.textContent='Rendering…';const buf=await renderBuffer();ensureCtx();const dst=ctx.createMediaStreamDestination(),src=ctx.createBufferSource();src.buffer=buf;src.connect(dst);
 const rec=new MediaRecorder(dst.stream,{mimeType:mt}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);
 rec.onstop=()=>{download(new Blob(chunks,{type:mt}),'deadsilence-beat.'+(mt.includes('ogg')?'ogg':'webm'));b.textContent='Export OGG'};
 rec.start();src.start();b.textContent='Recording (real-time)…';src.onended=()=>rec.stop()}
// ---------- UI ----------
function showStep(s){document.querySelectorAll('.st.cur').forEach(e=>e.classList.remove('cur'));if(s>=0)document.querySelectorAll('.st[data-i="'+s+'"]').forEach(e=>e.classList.add('cur'));drawRoll(s)}
let padCur={ch:0,step:0};
function renderRack(){const box=$('channels');box.innerHTML='';P.channels.forEach((ch,k)=>{const r=document.createElement('div');r.className='ch'+(k===sel?' sel':'');
 r.innerHTML=`<button class="ms m${ch.mute?' on':''}" title="Mute">M</button><button class="ms s${ch.solo?' on':''}" title="Solo">S</button>
 <input type="range" class="vol" min="0" max="1" step="0.01" value="${ch.vol}" title="Volume"><input type="range" class="pan" min="-1" max="1" step="0.01" value="${ch.pan}" title="Pan">
 <div class="nm ${ch.type}">${ch.name}</div><div class="steps"></div><button class="x" title="Delete">✕</button>`;
 const st=r.querySelector('.steps');for(let i=0;i<NSTEPS;i++){const e=document.createElement('div');const on=ch.type==='drum'?ch.steps[i]:ch.notes.some(n=>n.step<=i&&i<n.step+n.len);
  e.className='st'+(Math.floor(i/4)%2?' alt':'')+(on?' on':'')+(ch.type==='synth'?' dis':'')+(padOn&&padCur.ch===k&&padCur.step===i?' pad':'');e.dataset.i=i;
  e.onclick=()=>{if(ch.type==='drum'){ch.steps[i]=!ch.steps[i];e.classList.toggle('on')}else{sel=k;renderAll()}};st.appendChild(e)}
 r.querySelector('.m').onclick=()=>{ch.mute=!ch.mute;rebuildOuts();renderRack()};r.querySelector('.s').onclick=()=>{ch.solo=!ch.solo;rebuildOuts();renderRack()};
 r.querySelector('.vol').oninput=e=>{ch.vol=+e.target.value;rebuildOuts()};r.querySelector('.pan').oninput=e=>{ch.pan=+e.target.value;rebuildOuts()};
 r.querySelector('.nm').onclick=()=>{sel=k;renderAll();if(ch.type==='drum'){ensureCtx();drum(ctx,master,ch.kind,ctx.currentTime)}};
 r.querySelector('.x').onclick=()=>{if(P.channels.length>1){P.channels.splice(k,1);sel=Math.min(sel,P.channels.length-1);rebuildOuts();renderAll()}};box.appendChild(r)})}
const KW=56,CW=56,RH=13,cv=$('pr'),g2=cv.getContext('2d');cv.width=KW+CW*NSTEPS;cv.height=RH*(HIGH-LOW+1);
const isBlack=m=>[1,3,6,8,10].includes(m%12),rowY=p=>(HIGH-p)*RH;
function drawRoll(play=-1){const ch=P.channels[sel];g2.fillStyle='#0c0c0e';g2.fillRect(0,0,cv.width,cv.height);
 for(let p=LOW;p<=HIGH;p++){const y=rowY(p);g2.fillStyle=isBlack(p)?'#0f0f12':'#141417';g2.fillRect(KW,y,cv.width,RH);g2.fillStyle=isBlack(p)?'#222':'#bbb';g2.fillRect(0,y,KW-2,RH-1);
  if(p%12===0){g2.fillStyle='#000';g2.font='9px Inter,sans-serif';g2.fillText('C'+(p/12-1),4,y+10);g2.fillStyle='#333';g2.fillRect(KW,y+RH-1,cv.width,1)}}
 for(let i=0;i<=NSTEPS;i++){g2.fillStyle=i%4?'#1c1c20':'#333';g2.fillRect(KW+i*CW,0,1,cv.height)}
 if(play>=0){g2.fillStyle='rgba(164,0,0,.15)';g2.fillRect(KW+play*CW,0,CW,cv.height)}
 if(!ch||ch.type!=='synth'){g2.fillStyle='#555';g2.font='12px Inter,sans-serif';g2.fillText('SELECT A SYNTH CHANNEL',KW+20,30);return}
 ch.notes.forEach(n=>{const y=rowY(n.pitch);g2.fillStyle='#a40000';g2.fillRect(KW+n.step*CW+1,y+1,n.len*CW-2,RH-2);g2.fillStyle='#ff4040';g2.fillRect(KW+n.step*CW+1,y+1,3,RH-2)})}
let drag=null;
cv.onmousedown=e=>{const ch=P.channels[sel];if(!ch||ch.type!=='synth')return;const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(x<KW)return;
 const s=Math.floor((x-KW)/CW),p=HIGH-Math.floor(y/RH);const hit=ch.notes.findIndex(n=>n.pitch===p&&n.step<=s&&s<n.step+n.len);
 if(hit>=0)ch.notes.splice(hit,1);else{const n={step:s,pitch:p,len:1};ch.notes.push(n);drag={n,s};ensureCtx();synth(ctx,master,ch.syn,ctx.currentTime,p,.2)}renderAll()};
cv.onmousemove=e=>{if(!drag)return;const r=cv.getBoundingClientRect(),s=Math.floor((e.clientX-r.left-KW)/CW);drag.n.len=Math.max(1,Math.min(NSTEPS-drag.n.step,s-drag.s+1));drawRoll()};
window.addEventListener('mouseup',()=>{if(drag){drag=null;renderRack()}});
function renderSynthPanel(){const ch=P.channels[sel],on=ch&&ch.type==='synth';$('rollName').textContent=on?ch.name:'select a synth channel';$('preset').disabled=!on;
 document.querySelectorAll('.adsr input').forEach(i=>{i.disabled=!on;if(on)i.value=ch.syn[i.dataset.k]});if(on)$('preset').value=ch.kind}
$('preset').onchange=e=>{const ch=P.channels[sel];ch.kind=e.target.value;ch.syn={...PRESETS[ch.kind]};ch.name=PRESETS[ch.kind].name;renderAll()};
document.querySelectorAll('.adsr input').forEach(i=>i.oninput=()=>{const ch=P.channels[sel];if(ch.syn)ch.syn[i.dataset.k]=+i.value});
function renderAll(){renderRack();renderSynthPanel();drawRoll();$('bpm').value=P.bpm;$('swing').value=P.swing;$('master').value=P.master}
$('play').onclick=play;$('stop').onclick=stop;$('bpm').onchange=e=>{P.bpm=Math.max(40,Math.min(240,+e.target.value||120))};
$('swing').oninput=e=>P.swing=+e.target.value;$('master').oninput=e=>{P.master=+e.target.value;if(master)master.gain.value=P.master};
$('addSynth').onclick=()=>{P.channels.push(newCh('synth','saw'));sel=P.channels.length-1;rebuildOuts();renderAll()};
$('addDrum').onclick=()=>{const k=prompt('Drum type: '+DRUMS.join(', '),'kick');if(DRUMS.includes(k)){P.channels.push(newCh('drum',k));rebuildOuts();renderAll()}};
$('save').onclick=()=>download(new Blob([JSON.stringify(P,null,1)],{type:'application/json'}),'project.dsbeat.json');
$('loadBtn').onclick=()=>$('load').click();
$('load').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(!Array.isArray(p.channels))throw 0;p.channels.forEach(c=>{if(c.type==='synth')c.syn={...PRESETS[c.kind]||PRESETS.saw,...c.syn}});stop();P=p;sel=0;renderAll()}catch{alert('Invalid project file')}e.target.value=''};
$('export').onclick=exportWav;$('exportOgg').onclick=exportOgg;
window.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'){e.preventDefault();toggle()}});
// ---------- gamepad ----------
let padOn=false,prev=[];
function padLoop(){const gp=[...(navigator.getGamepads?navigator.getGamepads():[])].find(Boolean);
 if(gp){if(!padOn){padOn=true;$('pad').classList.add('on');$('pad').textContent='🎮 on';renderRack()}
  const b=gp.buttons.map(x=>x.pressed),hit=i=>b[i]&&!prev[i];let mv=false;
  if(hit(0)||hit(9))toggle();if(hit(1))stop();
  if(hit(12)){padCur.ch=(padCur.ch-1+P.channels.length)%P.channels.length;mv=true}if(hit(13)){padCur.ch=(padCur.ch+1)%P.channels.length;mv=true}
  if(hit(14)){padCur.step=(padCur.step+NSTEPS-1)%NSTEPS;mv=true}if(hit(15)){padCur.step=(padCur.step+1)%NSTEPS;mv=true}
  if(hit(4)||hit(5)){sel=(sel+(hit(5)?1:-1)+P.channels.length)%P.channels.length;padCur.ch=sel;renderAll()}
  if(hit(2)){const ch=P.channels[padCur.ch];if(ch.type==='drum')ch.steps[padCur.step]=!ch.steps[padCur.step];else{const i=ch.notes.findIndex(n=>n.step===padCur.step);if(i>=0)ch.notes.splice(i,1);else ch.notes.push({step:padCur.step,pitch:60,len:1})}mv=true;drawRoll()}
  if(mv)renderRack();prev=b}requestAnimationFrame(padLoop)}
// ---------- boot ----------
function hideSplash(){const s=$('splash');if(!s.classList.contains('out')){s.classList.add('out');setTimeout(()=>s.remove(),700)}}
$('splash').onclick=hideSplash;window.addEventListener('keydown',hideSplash,{once:true});setTimeout(hideSplash,2000);
P=defaultProject();renderAll();requestAnimationFrame(padLoop);
window.__dsbeat={renderBuffer,wav,get P(){return P}};
