const TOTAL_PRIZES = 20;
const STORAGE_KEY = "doorprize-akhir-tahun-2026-v1";
const defaultPrizes = Array.from({length: TOTAL_PRIZES}, (_, i) => `Doorprize ${String(i+1).padStart(2,"0")}`);

let state = loadState();
let available = [];
let drawing = false;

const $ = id => document.getElementById(id);
const prizeTitle = $("prizeTitle"), winnerName = $("winnerName"), winnerNo = $("winnerNo");
const stageLabel = $("stageLabel"), drawnCount = $("drawnCount"), results = $("results");
const drawBtn = $("drawBtn"), nextBtn = $("nextBtn"), prizeInputs = $("prizeInputs");

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if(saved && Array.isArray(saved.prizes) && Array.isArray(saved.winners)){
      return {prizes:[...defaultPrizes].map((x,i)=>saved.prizes[i] || x), winners:saved.winners};
    }
  }catch(e){}
  return {prizes:[...defaultPrizes], winners:[]};
}
function saveState(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state))}
function resetAvailable(){
  const used = new Set(state.winners.map(w => w.no));
  available = window.PARTICIPANTS.filter(p => !used.has(p.no));
}
function currentIndex(){return state.winners.length}
function currentPrize(){return state.prizes[currentIndex()] || `Doorprize ${String(currentIndex()+1).padStart(2,"0")}`}
function renderPrizeInputs(){
  prizeInputs.innerHTML="";
  state.prizes.forEach((p,i)=>{
    const wrap=document.createElement("label"); wrap.className="prize-item";
    wrap.innerHTML=`<span>${String(i+1).padStart(2,"0")}</span><input data-prize="${i}" value="${escapeAttr(p)}" aria-label="Nama hadiah ${i+1}">`;
    prizeInputs.appendChild(wrap);
  });
}
function render(){
  const idx=currentIndex();
  prizeTitle.textContent=idx<TOTAL_PRIZES?currentPrize():"SEMUA HADIAH SELESAI";
  drawnCount.textContent=idx;
  if(idx>=TOTAL_PRIZES){
    stageLabel.textContent="SELESAI";
    winnerName.textContent="SELAMAT! 🎉";
    winnerNo.textContent="20 pemenang sudah terpilih";
    drawBtn.disabled=true; nextBtn.disabled=true;
  }else{
    drawBtn.disabled=drawing;
    nextBtn.disabled=true;
    if(!drawing && idx===0){stageLabel.textContent="SIAP DIUNDI";winnerName.textContent="TEKAN “UNDI SEKARANG”";winnerNo.textContent=`${available.length} peserta tersedia`;}
    else if(!drawing){stageLabel.textContent="HADIAH BERIKUTNYA";winnerName.textContent="SIAP";winnerNo.textContent=`${available.length} peserta tersedia`;}
  }
  renderResults();
}
function renderResults(){
  if(!state.winners.length){
    results.className="results empty";
    results.innerHTML='<div class="empty-icon">🏆</div><p>Belum ada pemenang.</p><small>Hasil akan muncul di sini.</small>';
    return;
  }
  results.className="results";
  results.innerHTML=state.winners.map((w,i)=>`
    <div class="result-row">
      <div class="result-num">${String(i+1).padStart(2,"0")}</div>
      <div>
        <div class="result-prize">${escapeHtml(w.prize)}</div>
        <div class="result-name">${escapeHtml(w.name)}</div>
        <div class="result-meta">No. peserta ${w.no}</div>
      </div>
    </div>`).join("");
  results.scrollTop=results.scrollHeight;
}
function secureRandomInt(max){
  if(max<=1)return 0;
  const a=new Uint32Array(1);
  const limit=Math.floor(0x100000000/max)*max;
  do{crypto.getRandomValues(a)}while(a[0]>=limit);
  return a[0]%max;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escapeAttr(s){return escapeHtml(s).replace(/`/g,"&#096;")}
function showToast(msg){
  const t=$("toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2200);
}

async function draw(){
  if(drawing || currentIndex()>=TOTAL_PRIZES || !available.length)return;
  drawing=true;drawBtn.disabled=true;nextBtn.disabled=true;
  const prize=currentPrize();
  stageLabel.textContent="MENGUNDI...";
  $("winnerStage").classList.add("drawing");
  const duration=2200, start=performance.now();
  let last="";
  const tick=now=>{
    const elapsed=now-start;
    const pool=available;
    const p=pool[secureRandomInt(pool.length)];
    winnerName.textContent=p.name;
    winnerNo.textContent=`No. peserta ${p.no}`;
    if(elapsed<duration){
      const delay=elapsed<1300?70:elapsed<1800?110:170;
      setTimeout(()=>requestAnimationFrame(tick),delay);
    }else finishDraw();
  };
  requestAnimationFrame(tick);
  function finishDraw(){
    const winner=available[secureRandomInt(available.length)];
    const record={no:winner.no,name:winner.name,prize};
    state.winners.push(record); available=available.filter(p=>p.no!==winner.no);
    saveState(); drawing=false;
    $("winnerStage").classList.remove("drawing");$("winnerStage").classList.add("celebrate");
    stageLabel.textContent="PEMENANG";
    winnerName.textContent=winner.name;
    winnerNo.textContent=`No. peserta ${winner.no}`;
    drawBtn.disabled=true;nextBtn.disabled=currentIndex()>=TOTAL_PRIZES;
    renderResults();drawnCount.textContent=currentIndex();
    if(currentIndex()<TOTAL_PRIZES){
      prizeTitle.textContent=currentPrize();
      setTimeout(()=>{$("winnerStage").classList.remove("celebrate");nextBtn.disabled=false},650);
    }else render();
  }
}
function nextPrize(){
  if(currentIndex()<TOTAL_PRIZES){render();$("winnerStage").scrollIntoView({behavior:"smooth",block:"center"});}
}
function savePrizes(){
  document.querySelectorAll("[data-prize]").forEach(input=>{
    const i=Number(input.dataset.prize);
    state.prizes[i]=input.value.trim() || defaultPrizes[i];
  });
  saveState();render();showToast("Nama 20 hadiah berhasil disimpan.");
}
function resetAll(){
  if(!confirm("Reset semua hasil undian dan kembali ke 0 pemenang?"))return;
  state={prizes:[...state.prizes],winners:[]};saveState();resetAvailable();render();
  showToast("Undian sudah di-reset.");
}
function exportCsv(){
  if(!state.winners.length){showToast("Belum ada hasil untuk diekspor.");return}
  const lines=[["Urutan","Hadiah","No Peserta","Nama"].join(",")];
  state.winners.forEach((w,i)=>lines.push([i+1,csv(w.prize),w.no,csv(w.name)].join(",")));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hasil-doorprize-akhir-tahun-2026.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function csv(v){return `"${String(v).replace(/"/g,'""')}"`}
async function fullscreen(){
  if(!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
}
drawBtn.addEventListener("click",draw);
nextBtn.addEventListener("click",nextPrize);
$("savePrizesBtn").addEventListener("click",savePrizes);
$("resetBtn").addEventListener("click",resetAll);
$("exportBtn").addEventListener("click",exportCsv);
$("fullscreenBtn").addEventListener("click",fullscreen);
document.addEventListener("keydown",e=>{
  if(e.code==="Space" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){
    e.preventDefault(); if(!drawing) draw();
  }
});
resetAvailable();renderPrizeInputs();render();
