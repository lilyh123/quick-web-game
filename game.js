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
const player = { x: W / 2, y: H - 66, w: 34, h: 40, speed: 440 };
const keys = { left: false, right: false };
const colors = ["#ff796c", "#ffb84d", "#9a82ed", "#28c7bd", "#ed83b5"];
let obstacles = [], particles = [], stars = [], clouds = [];
let score = 0, best = Number(localStorage.getItem("dodge-best") || 0);
let elapsed = 0, spawnTimer = 0, lastTime = 0, running = false, animationId = 0;
let level = 1, shake = 0;

bestEl.textContent = format(best);
for (let i = 0; i < 85; i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+.5,a:Math.random()*.25+.08});
for (let i = 0; i < 7; i++) clouds.push({x:Math.random()*W,y:Math.random()*H,w:75+Math.random()*100,speed:8+Math.random()*14});

function format(n){ return String(Math.floor(n)).padStart(4,"0"); }
function startGame(){
  cancelAnimationFrame(animationId);
  score=0; elapsed=0; spawnTimer=0; level=1; obstacles=[]; particles=[]; shake=0;
  player.x=W/2; keys.left=false; keys.right=false;
  running=true; overlay.classList.add("hidden"); updateStats(); lastTime=performance.now();
  animationId=requestAnimationFrame(loop);
}
function endGame(){
  running=false;
  if(score>best){best=score;localStorage.setItem("dodge-best",String(best));}
  updateStats();
  kickerEl.textContent="WAVE COMPLETE";
  titleEl.textContent="SO CLOSE!";
  copyEl.textContent=`You scored ${format(score)} points. Ready to beat that score?`;
  startButton.innerHTML='TRY AGAIN <span>↻</span>';
  overlay.classList.remove("hidden");
}
function updateStats(){scoreEl.textContent=format(score);bestEl.textContent=format(best);levelEl.textContent=String(level).padStart(2,"0");}
function spawnObstacle(x=null,y=-50,extraSpeed=0){
  const size=23+Math.random()*25;
  const type=Math.random();
  obstacles.push({
    x:x===null?18+Math.random()*(W-size-36):x,y,w:size,h:size,
    speed:205+Math.min(elapsed*5.2,260)+Math.random()*85+extraSpeed,
    drift:(Math.random()-.5)*(level>2?95:35),
    color:colors[Math.floor(Math.random()*colors.length)],
    shape:type<.34?"circle":type<.68?"diamond":"square",
    rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*2.4
  });
}
function spawnWave(){
  // Waves become denser over time, with gaps left open so the player can thread through.
  const count=level<3?1:level<5?2:3;
  const gap=125;
  const gapCenter=100+Math.random()*(W-200);
  for(let i=0;i<count;i++){
    let x=18+Math.random()*(W-55);
    if(Math.abs(x-gapCenter)<gap/2)x= x<gapCenter?Math.max(18,gapCenter-gap/2-55):Math.min(W-55,gapCenter+gap/2);
    spawnObstacle(x,-45-i*62,i*14);
  }
}
function burst(x,y,color="#ff796c"){
  for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,s=70+Math.random()*240;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.65,max:.65,color,size:2+Math.random()*4});}
}
function hit(a,b){
  const pad=5; // Slightly forgiving collision edges keep near misses fair.
  return a.x-a.w/2+pad<b.x+b.w-pad&&a.x+a.w/2-pad>b.x+pad&&a.y-a.h/2+pad<b.y+b.h-pad&&a.y+a.h/2-pad>b.y+pad;
}
function loop(now){
  const dt=Math.min((now-lastTime)/1000,.033);lastTime=now;
  if(!running)return;
  elapsed+=dt;score=Math.floor(elapsed*12);level=1+Math.floor(elapsed/12);
  player.x+=(Number(keys.right)-Number(keys.left))*player.speed*dt;
  player.x=Math.max(22,Math.min(W-22,player.x));
  spawnTimer+=dt;
  const interval=Math.max(.27,.82-elapsed*.009);
  if(spawnTimer>interval){spawnTimer=0;spawnWave();}
  for(const o of obstacles){o.y+=o.speed*dt;o.x+=o.drift*dt;o.rotation+=o.spin*dt;if(o.x<8||o.x+o.w>W-8)o.drift*=-1;}
  obstacles=obstacles.filter(o=>o.y<H+o.h);
  for(const o of obstacles){if(hit(player,o)){burst(player.x,player.y,o.color);shake=9;draw();endGame();return;}}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  shake=Math.max(0,shake-30*dt);
  updateStats();draw();
  animationId=requestAnimationFrame(loop);
}
function roundedRect(x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function drawObstacle(o){
  ctx.save();ctx.translate(o.x+o.w/2,o.y+o.h/2);ctx.rotate(o.rotation);
  ctx.shadowColor=o.color;ctx.shadowBlur=15;ctx.fillStyle=o.color;
  if(o.shape==="circle"){ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();}
  else if(o.shape==="diamond"){ctx.beginPath();ctx.moveTo(0,-o.h*.65);ctx.lineTo(o.w*.65,0);ctx.lineTo(0,o.h*.65);ctx.lineTo(-o.w*.65,0);ctx.closePath();ctx.fill();}
  else{roundedRect(-o.w/2,-o.h/2,o.w,o.h,7);ctx.fill();}
  ctx.shadowBlur=0;ctx.fillStyle="#ffffff99";ctx.beginPath();ctx.arc(-o.w*.13,-o.h*.15,Math.max(2,o.w*.08),0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawPlayer(){
  ctx.save();ctx.translate(player.x,player.y);
  ctx.shadowColor="#0eaaa6";ctx.shadowBlur=20;
  ctx.fillStyle="#19bdb5";ctx.beginPath();ctx.moveTo(0,-24);ctx.quadraticCurveTo(21,-4,15,19);ctx.quadraticCurveTo(0,12,-15,19);ctx.quadraticCurveTo(-21,-4,0,-24);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle="#e9fffb";ctx.beginPath();ctx.ellipse(0,-3,5,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffb84d";ctx.beginPath();ctx.moveTo(-6,17);ctx.lineTo(0,29+Math.random()*4);ctx.lineTo(6,17);ctx.fill();
  ctx.restore();
}
function draw(){
  ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  ctx.clearRect(-12,-12,W+24,H+24);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#dff5ff");bg.addColorStop(.55,"#eef9ff");bg.addColorStop(1,"#fff1db");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Soft sun glow and a subtle playfield grid.
  const sun=ctx.createRadialGradient(650,90,8,650,90,230);sun.addColorStop(0,"#fff5bd99");sun.addColorStop(1,"#fff5bd00");ctx.fillStyle=sun;ctx.fillRect(400,-120,450,430);
  ctx.strokeStyle="#92b9d022";ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(const c of clouds){c.x+=c.speed/60;if(c.x>W+120)c.x=-c.w;ctx.fillStyle="#ffffff55";ctx.beginPath();ctx.ellipse(c.x,c.y,c.w/2,13,0,0,Math.PI*2);ctx.fill();}
  for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle="#7195b5";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  // Small side rails make the safe play area easy to read.
  ctx.fillStyle="#ffffff55";ctx.fillRect(0,0,8,H);ctx.fillRect(W-8,0,8,H);
  for(const o of obstacles)drawObstacle(o);
  drawPlayer();
  for(const p of particles){ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;ctx.restore();
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
  player.x=((e.clientX-rect.left)/rect.width)*W;
  player.x=Math.max(22,Math.min(W-22,player.x));
});
startButton.addEventListener("click",()=>{kickerEl.textContent="READY WHEN YOU ARE";startGame();});
draw();