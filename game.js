const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const levelEl = document.querySelector("#level");
const overlay = document.querySelector("#overlay");
const titleEl = document.querySelector("#overlay-title");
const kickerEl = document.querySelector("#overlay-kicker");
const copyEl = document.querySelector("#overlay-copy");
const startButton = document.querySelector("#start-button");

const W = canvas.width, H = canvas.height;
const player = { x: W / 2 - 18, y: H - 66, w: 36, h: 36, speed: 390 };
const keys = { left: false, right: false };
let obstacles = [], particles = [], stars = [];
let score = 0, best = Number(localStorage.getItem("dodge-best") || 0);
let elapsed = 0, spawnTimer = 0, lastTime = 0, running = false, animationId = 0;
let level = 1;

bestEl.textContent = format(best);
for (let i = 0; i < 75; i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+.3,a:Math.random()*.55+.15});

function format(n){ return String(Math.floor(n)).padStart(4,"0"); }
function startGame(){
  cancelAnimationFrame(animationId);
  score=0; elapsed=0; spawnTimer=0; level=1; obstacles=[]; particles=[];
  player.x=W/2-player.w/2; keys.left=false; keys.right=false;
  running=true; overlay.classList.add("hidden"); updateStats(); lastTime=performance.now();
  animationId=requestAnimationFrame(loop);
}
function endGame(){
  running=false;
  if(score>best){best=score;localStorage.setItem("dodge-best",String(best));}
  updateStats();
  kickerEl.textContent="RUN COMPLETE";
  titleEl.textContent="NICE TRY.";
  copyEl.textContent=`You scored ${format(score)} points. Take another run?`;
  startButton.innerHTML='PLAY AGAIN <span>↻</span>';
  overlay.classList.remove("hidden");
}
function updateStats(){scoreEl.textContent=format(score);bestEl.textContent=format(best);levelEl.textContent=String(level).padStart(2,"0");}
function spawnObstacle(){
  const size=24+Math.random()*30;
  obstacles.push({x:12+Math.random()*(W-size-24),y:-size,w:size,h:size,speed:175+level*25+Math.random()*65,hue:Math.random()<.5?174:260});
}
function burst(x,y){
  for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,s=50+Math.random()*180;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45,max:.45});}
}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function loop(now){
  const dt=Math.min((now-lastTime)/1000,.033);lastTime=now;
  if(!running)return;
  elapsed+=dt;score=Math.floor(elapsed*10);level=1+Math.floor(elapsed/15);
  player.x+=(Number(keys.right)-Number(keys.left))*player.speed*dt;
  player.x=Math.max(10,Math.min(W-player.w-10,player.x));
  spawnTimer+=dt;
  const interval=Math.max(.28,.9-level*.055);
  if(spawnTimer>interval){spawnTimer=0;spawnObstacle();}
  for(const o of obstacles)o.y+=o.speed*dt;
  obstacles=obstacles.filter(o=>o.y<H+o.h);
  for(const o of obstacles){if(hit(player,o)){burst(player.x+18,player.y+18);draw();endGame();return;}}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  updateStats();draw();
  animationId=requestAnimationFrame(loop);
}
function draw(){
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#0d142a");bg.addColorStop(1,"#080d1d");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#26304a55";ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle="#c4d5ff";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  for(const o of obstacles){ctx.save();ctx.shadowBlur=18;ctx.shadowColor=o.hue===174?"#5cf2e5":"#a78bfa";ctx.fillStyle=o.hue===174?"#5cf2e5":"#a78bfa";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle="#ffffff55";ctx.fillRect(o.x+4,o.y+4,o.w-8,3);ctx.restore();}
  ctx.save();ctx.shadowBlur=24;ctx.shadowColor="#5cf2e5";ctx.fillStyle="#5cf2e5";ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillStyle="#102333";ctx.fillRect(player.x+9,player.y+9,18,18);ctx.fillStyle="#d8fffb";ctx.fillRect(player.x+14,player.y+14,8,8);ctx.restore();
  for(const p of particles){ctx.globalAlpha=p.life/p.max;ctx.fillStyle="#5cf2e5";ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
}
function setDirection(dir,on){if(dir==="left")keys.left=on;if(dir==="right")keys.right=on;}
window.addEventListener("keydown",e=>{
  if(["ArrowLeft","ArrowRight","a","A","d","D"," "].includes(e.key))e.preventDefault();
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")setDirection("left",true);
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")setDirection("right",true);
  if(e.key===" "&&!running)startGame();
});
window.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")setDirection("left",false);
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")setDirection("right",false);
});
window.addEventListener("blur",()=>{keys.left=false;keys.right=false;});
document.querySelectorAll(".move-button").forEach(button=>{
  const dir=button.dataset.dir==="1"?"right":"left";
  button.addEventListener("pointerdown",e=>{e.preventDefault();button.setPointerCapture(e.pointerId);setDirection(dir,true);});
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>button.addEventListener(type,()=>setDirection(dir,false)));
});
canvas.addEventListener("pointermove",e=>{
  if(!running||e.pointerType!=="touch")return;
  const rect=canvas.getBoundingClientRect();
  player.x=((e.clientX-rect.left)/rect.width)*W-player.w/2;
  player.x=Math.max(10,Math.min(W-player.w-10,player.x));
});
startButton.addEventListener("click",()=>{kickerEl.textContent="READY PLAYER ONE";startGame();});
draw();