/* x402 Charity — interactive bits, wired to live backend (/donations, /address, /charity, POST /donate) */

/* ─── tiny shared helpers ───────────────────────────────────────── */
function shortAddr(a){
  if(!a || typeof a!=='string') return '—';
  if(a.length<=10) return a;
  return a.slice(0,4)+'…'+a.slice(-4);
}
function shortSig(s){
  if(!s || typeof s!=='string') return '—';
  if(s.length<=12) return s;
  return s.slice(0,6)+'…'+s.slice(-4);
}
function timeAgo(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<5) return 'just now';
  if(s<60) return s+'s ago';
  const m = Math.floor(s/60);
  if(m<60) return m+'m ago';
  const h = Math.floor(m/60);
  if(h<24) return h+'h ago';
  const d = Math.floor(h/24);
  return d+'d ago';
}
function explorerForTx(chain, sig){
  if(!sig) return '#';
  const base = 'https://solscan.io/tx/' + sig;
  return chain==='solana-devnet' ? base+'?cluster=devnet' : base;
}
function explorerForAddr(chain, addr){
  if(!addr) return '#';
  const base = 'https://solscan.io/account/' + addr;
  return chain==='solana-devnet' ? base+'?cluster=devnet' : base;
}
function parseAmount(amt){
  // accepts "$0.001" or "0.001" → number
  if(typeof amt==='number') return amt;
  if(typeof amt!=='string') return 0;
  const n = parseFloat(amt.replace(/[^0-9.]/g,''));
  return isFinite(n) ? n : 0;
}
function networkLabel(chain){
  if(chain==='solana-mainnet') return 'Solana';
  if(chain==='solana-devnet')  return 'Solana Devnet';
  return chain || '—';
}
function fmtUsd(n, opts){
  return n.toLocaleString('en-US', Object.assign({minimumFractionDigits:2, maximumFractionDigits:2}, opts||{}));
}

/* Shared store fetched once on load and re-fetched on Refresh */
const STORE = {
  donations: [],    // donation rows from GET /donations
  totalNum: 0,
  count: 0,
  network: 'solana-devnet',
  donorAddress: null,
  donorBalances: null,
  charity: null,
};

async function fetchJson(url, opts){
  try{
    const r = await fetch(url, opts);
    if(!r.ok) return null;
    return await r.json();
  }catch{ return null; }
}

async function refreshAll(){
  const [donations, address, charity] = await Promise.all([
    fetchJson('/donations?limit=200'),
    fetchJson('/address'),
    fetchJson('/charity'),
  ]);
  if(donations){
    STORE.donations = donations.donations || [];
    STORE.totalNum  = parseAmount(donations.total);
    STORE.count     = donations.count || STORE.donations.length;
    STORE.network   = donations.network || STORE.network;
  }
  if(address){
    STORE.donorAddress  = address.address || null;
    STORE.donorBalances = address.balances || null;
  }
  if(charity){
    STORE.charity = charity;
  }
  renderHero();
  renderDashboard();
  return STORE;
}

/* ─── HERO live feed ───────────────────────────────────────────── */
function renderHero(){
  const feed     = document.getElementById('liveFeed');
  const total    = document.getElementById('liveTotal');
  const sub      = document.getElementById('liveSub');
  const netTag   = document.getElementById('heroNetworkTag');
  const netName  = document.getElementById('heroNetworkName');
  if(!feed) return;

  const cluster = STORE.network==='solana-mainnet' ? 'SOLANA' : 'SOLANA DEVNET';
  if(netTag) netTag.textContent = cluster;
  if(netName) netName.textContent = STORE.network==='solana-mainnet' ? 'Solana' : 'Solana Devnet';

  // Last 24h
  const cutoff = Date.now() - 24*60*60*1000;
  const recent = STORE.donations.filter(d=>d && d.timestamp && d.timestamp >= cutoff);
  const total24 = recent.reduce((s,d)=>s+parseAmount(d.amount), 0);

  total.innerHTML = `$${fmtUsd(total24)}<small>USDC</small>`;
  sub.textContent = recent.length
    ? `${recent.length.toLocaleString()} on-chain donation${recent.length===1?'':'s'} · last 24h`
    : 'No donations in the last 24h — fund the wallet to start';

  feed.innerHTML = '';
  if(!recent.length){
    const empty = document.createElement('div');
    empty.className = 'feed-empty';
    empty.textContent = 'Waiting for the first on-chain donation…';
    feed.appendChild(empty);
    return;
  }
  for(const d of recent.slice(0,5)){
    const row = document.createElement('div');
    row.className = 'feed-row';
    const amt = parseAmount(d.amount);
    const sig = d.txHash || '';
    const txLink = sig ? `<a href="${explorerForTx(d.chain, sig)}" target="_blank" rel="noopener">${shortSig(sig)}</a>` : shortSig('');
    row.innerHTML = `
      <div class="feed-ico">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </div>
      <div class="feed-meta">
        <div class="a">${txLink}</div>
        <div class="b">${networkLabel(d.chain)} · ${timeAgo(d.timestamp)}</div>
      </div>
      <div class="feed-amt">+$${amt.toFixed(3)}</div>
    `;
    feed.appendChild(row);
  }
}

/* ─── How it works — step through flow ──────────────────────────── */
(function flow(){
  const steps = [
    {title:'A user takes an action in your product',
     text:'No wallet, no balance, no crypto literacy required. A user simply taps "Buy", "Swap", "Send message" — anything you want to attach a donation to.'},
    {title:'Your product fires a POST /donate',
     text:'Your product server makes one tiny HTTP call to your x402 charity server. Any backend works — Node, Python, Go, Rust, Ruby — it\'s just a REST request.'},
    {title:'The x402 charity server signs a payment',
     text:'Your deployment holds the company-funded USDC. It signs a partial SPL USDC transfer on Solana — your hot wallet pays USDC, the facilitator pays gas, no user signatures needed.'},
    {title:'x402.org settles the payment on-chain',
     text:'The open x402 payment protocol facilitator co-signs as fee payer and submits the transaction to Solana. It lands in under a second with a verifiable on-chain proof.'},
    {title:'Your chosen charity receives USDC',
     text:'A fraction of a cent in USDC lands in the charity wallet — Give Directly, Khan Academy, or any address you point at. Every donation is public and auditable on Solscan.'}
  ];
  const nodes = document.querySelectorAll('.flow-node');
  const pulse = document.getElementById('flowPulse');
  const back  = document.getElementById('flowBack');
  const next  = document.getElementById('flowNext');
  const stepNo= document.getElementById('flowStepNo');
  const title = document.getElementById('flowTitle');
  const text  = document.getElementById('flowText');
  const prog  = document.getElementById('flowProg');
  if(!nodes.length || !pulse || !back || !next) return;
  let i = 0;
  function render(){
    nodes.forEach((n,idx)=>n.classList.toggle('on', idx===i));
    const pct = 10 + (i*20);
    pulse.style.left = `${pct}%`;
    stepNo.textContent = `Step ${i+1} of ${steps.length}`;
    title.textContent = steps[i].title;
    text.textContent  = steps[i].text;
    [...prog.children].forEach((s,idx)=>s.classList.toggle('on', idx<=i));
    back.disabled = i===0;
    next.disabled = false;
    next.querySelector('svg').style.transform = i===steps.length-1 ? 'rotate(180deg)' : 'none';
  }
  back.addEventListener('click',()=>{i=Math.max(0,i-1);render();});
  next.addEventListener('click',()=>{
    if(i===steps.length-1){ i=0; } else { i++; }
    render();
  });
  nodes.forEach((n,idx)=>n.addEventListener('click',()=>{i=idx;render();}));
  render();
  let autoTimer = setInterval(()=>{ i=(i+1)%steps.length; render(); }, 3800);
  document.querySelector('.flow').addEventListener('mouseenter',()=>clearInterval(autoTimer));
})();

/* ─── DEMO: Charity Runner (real POST /donate per obstacle) ─────── */
(function game(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('gameOver');
  const overlayTitle = document.getElementById('gameOverTitle');
  const overlayText  = document.getElementById('gameOverText');
  const startBtn = document.getElementById('gameStart');
  const elScore = document.getElementById('gScore');
  const elBest  = document.getElementById('gBest');
  const elDon   = document.getElementById('gDonated');
  const logBody = document.getElementById('logBody');

  function size(){
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = r.width*dpr;
    canvas.height = r.height*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  size();
  window.addEventListener('resize',size);

  const W = ()=>canvas.getBoundingClientRect().width;
  const H = ()=>canvas.getBoundingClientRect().height;
  const groundY = ()=>H()-50;

  let state = 'idle';
  let player = {x:80,y:0,vy:0,w:34,h:42};
  let obstacles = [];
  let speed = 5;
  let spawnT = 0;
  let score = 0;
  let best = parseInt(localStorage.getItem('cr_best')||'0',10);
  let donated = parseFloat(localStorage.getItem('cr_donated')||'0');
  let logRows = [];      // {key, status, txHash?, chain?, when, error?}
  let cleared = new Set();
  let demoLocked = false; // true once we receive a 401 from /donate

  function reset(){
    player.y = groundY()-player.h;
    player.vy = 0;
    obstacles = [];
    speed = 5;
    spawnT = 0;
    score = 0;
    cleared = new Set();
    updateHUD();
  }
  function updateHUD(){
    elScore.textContent = score;
    elBest.textContent = best;
    elDon.textContent = '$'+donated.toFixed(3);
  }
  function jump(){
    if(state!=='playing') return;
    if(Math.abs((groundY()-player.h)-player.y)<2){
      player.vy = -12.5;
    }
  }
  function start(){
    if(state==='playing') return;
    reset();
    state='playing';
    overlay.classList.add('hidden');
  }
  function over(){
    state='over';
    if(score>best){ best=score; localStorage.setItem('cr_best',best); }
    overlayTitle.textContent = 'Game over';
    overlayText.innerHTML = `You cleared <b style="color:var(--accent);font-weight:500">${score} obstacle${score===1?'':'s'}</b> and donated <b style="color:var(--accent);font-weight:500">$${donated.toFixed(3)} USDC</b>.`;
    startBtn.textContent='Play again';
    overlay.classList.remove('hidden');
    updateHUD();
  }
  startBtn.addEventListener('click',start);
  document.addEventListener('keydown',e=>{
    if(e.code==='Space'){
      e.preventDefault();
      if(state!=='playing') start();
      else jump();
    }
  });
  canvas.addEventListener('pointerdown',()=>{
    if(state!=='playing') start();
    else jump();
  });

  function spawn(){
    const tall = Math.random()<0.3;
    obstacles.push({
      x:W()+10,
      y:groundY()-(tall?54:36),
      w:tall?22:26,
      h:tall?54:36,
      id:Math.random()
    });
  }

  async function triggerDonation(){
    const key = 'k_'+Date.now()+'_'+Math.random();
    logRows.unshift({ key, status: 'pending', when: new Date(), txHash: null, chain: STORE.network });
    if(logRows.length>40) logRows.pop();
    renderLog();

    if(demoLocked){
      // Don't even hit the API; mark as locked
      const idx = logRows.findIndex(r=>r.key===key);
      if(idx>=0){
        logRows[idx].status = 'error';
        logRows[idx].error  = 'Demo locked — server requires API key';
        renderLog();
      }
      return;
    }

    try{
      const r = await fetch('/donate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ amount: '$0.001' }),
      });
      if(r.status === 401){
        demoLocked = true;
        const idx = logRows.findIndex(r=>r.key===key);
        if(idx>=0){
          logRows[idx].status = 'error';
          logRows[idx].error  = 'Demo locked — server requires API key';
        }
        renderLog();
        return;
      }
      const data = await r.json().catch(()=>({}));
      const idx = logRows.findIndex(r=>r.key===key);
      if(idx<0) return;
      if(r.ok && data && data.receipt){
        logRows[idx].status = 'ok';
        logRows[idx].txHash = data.receipt.txHash || '';
        logRows[idx].chain  = data.receipt.chain  || STORE.network;
        donated += parseAmount(data.receipt.amount || '$0.001');
        localStorage.setItem('cr_donated', donated);
        updateHUD();
      }else{
        logRows[idx].status = 'error';
        logRows[idx].error  = (data && (data.details || data.error)) || `HTTP ${r.status}`;
      }
      renderLog();
    }catch(err){
      const idx = logRows.findIndex(r=>r.key===key);
      if(idx>=0){
        logRows[idx].status = 'error';
        logRows[idx].error  = 'network error';
        renderLog();
      }
    }
  }

  function renderLog(){
    if(!logRows.length){
      logBody.innerHTML = '<div class="log-empty">Start running to trigger donations</div>';
      return;
    }
    logBody.innerHTML = logRows.map(r=>{
      const ago = timeAgo(r.when);
      let l1, l2, ic;
      let cls = 'log-row';
      if(r.status==='ok'){
        l1 = 'Donation settled';
        const txTxt = r.txHash ? `<a href="${explorerForTx(r.chain, r.txHash)}" target="_blank" rel="noopener">${shortSig(r.txHash)}</a>` : '—';
        l2 = `${txTxt} · ${ago}`;
        ic = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>';
      }else if(r.status==='pending'){
        cls += ' pending';
        l1 = 'Submitting donation…';
        l2 = `${networkLabel(r.chain)} · ${ago}`;
        ic = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/></svg>';
      }else{
        cls += ' error';
        l1 = 'Donation failed';
        l2 = (r.error || 'error') + ' · ' + ago;
        ic = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      }
      return `
        <div class="${cls}">
          <div class="log-ic">${ic}</div>
          <div class="log-meta">
            <div class="l1">${l1}</div>
            <div class="l2">${l2}</div>
          </div>
          <div class="log-amt">+$0.001</div>
        </div>
      `;
    }).join('');
  }
  setInterval(()=>{ if(logRows.length) renderLog(); }, 2000);

  function frame(){
    const w = W(), h=H(), gy=groundY();
    ctx.clearRect(0,0,w,h);

    ctx.strokeStyle = '#C5DDD4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0,gy+0.5);
    ctx.lineTo(w,gy+0.5);
    ctx.stroke();

    const now = Date.now();
    const offset = (now/16)%24;
    ctx.strokeStyle = 'rgba(0,152,89,0.18)';
    ctx.lineWidth = 1;
    for(let x=-offset;x<w;x+=24){
      ctx.beginPath();
      ctx.moveTo(x,gy+6);
      ctx.lineTo(x+10,gy+6);
      ctx.stroke();
    }

    if(state==='playing'){
      player.vy += 0.62;
      player.y  += player.vy;
      if(player.y>=gy-player.h){
        player.y = gy-player.h;
        player.vy = 0;
      }
      spawnT++;
      const spawnInterval = Math.max(50, 92 - score*1.2);
      if(spawnT>spawnInterval){
        spawnT = 0;
        spawn();
      }
      for(const o of obstacles){
        o.x -= speed;
        if(!cleared.has(o.id) && o.x+o.w < player.x){
          cleared.add(o.id);
          score++;
          triggerDonation();
          speed += 0.06;
          updateHUD();
        }
        if(player.x < o.x+o.w-4 && player.x+player.w-4 > o.x &&
           player.y < o.y+o.h-2 && player.y+player.h-2 > o.y){
          over();
        }
      }
      obstacles = obstacles.filter(o=>o.x+o.w>-20);
    }

    drawPlayer(player.x, player.y, player.w, player.h);
    obstacles.forEach(o=>drawObstacle(o));
    requestAnimationFrame(frame);
  }

  function drawPlayer(x,y,w,h){
    ctx.fillStyle = '#009859';
    ctx.beginPath();
    ctx.roundRect(x+6, y+12, w-12, h-12, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x+w/2, y+8, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#0C3124';
    ctx.fillRect(x+4, y+h-3, w-8, 3);
    ctx.fillStyle='#fff';
    ctx.font='12px Archivo, sans-serif';
    ctx.textAlign='center';
    ctx.fillText('♥', x+w/2, y+26);
  }
  function drawObstacle(o){
    ctx.fillStyle='rgba(12,49,36,0.08)';
    ctx.beginPath();
    ctx.ellipse(o.x+o.w/2, o.y+o.h, o.w*0.6, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#0C3124';
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 5);
    ctx.fill();
    ctx.fillStyle = '#12D16B';
    ctx.fillRect(o.x+3, o.y+6, o.w-6, 3);
  }

  if(!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
      this.beginPath();
      this.moveTo(x+r,y);
      this.arcTo(x+w,y,x+w,y+h,r);
      this.arcTo(x+w,y+h,x,y+h,r);
      this.arcTo(x,y+h,x,y,r);
      this.arcTo(x,y,x+w,y,r);
      this.closePath();
      return this;
    };
  }

  reset();
  updateHUD();
  renderLog();
  frame();
})();

/* ─── Setup section: step + code tabs ───────────────────── */
(function setup(){
  const steps = [
    {title:'env vars',
     body: c=>[
       c.com('# Create a new Solana wallet to fund donations.'),
       c.com('# Use any wallet (Phantom, Backpack, Solflare, solana-keygen)'),
       c.com('# and export the secret key — base58 or JSON array.'),
       '',
       c.com('# You\'ll need 3 env vars:'),
       `${c.var('DONATION_PRIVATE_KEY')}=${c.str('"[12,34,...]"')}   ${c.com('# base58 or JSON array')}`,
       `${c.var('CHARITY_WALLET')}=${c.str('"GiVe...rEcT"')}       ${c.com('# Solana base58 pubkey')}`,
       `${c.var('CHARITY_NAME')}=${c.str('"Give Directly"')}     ${c.com('# display name')}`,
       '',
       c.com('# Then fund the donation wallet with USDC on Solana.'),
       c.com('# SOL is NOT required — the facilitator pays gas.'),
     ].join('\n')
    },
    {title:'docker',
     body: c=>[
       c.com('# Clone and build with Docker'),
       `${c.kw('$')} git clone https://github.com/allscale-io/x402charity.git`,
       `${c.kw('$')} cd x402charity`,
       `${c.kw('$')} docker build -t x402charity .`,
       '',
       c.com('# Run with your env vars'),
       `${c.kw('$')} docker run -p 3402:3402 ${c.punct('\\')}`,
       `  -e ${c.var('DONATION_PRIVATE_KEY')}=${c.str('"[12,34,...]"')} ${c.punct('\\')}`,
       `  -e ${c.var('CHARITY_WALLET')}=${c.str('"GiVe...rEcT"')} ${c.punct('\\')}`,
       `  -e ${c.var('CHARITY_NAME')}=${c.str('"Give Directly"')} ${c.punct('\\')}`,
       `  -e ${c.var('DONATION_NETWORK')}=${c.str('"solana-mainnet"')} ${c.punct('\\')}`,
       '  x402charity',
       '',
       c.com('# Your server is live at http://localhost:3402'),
       c.com('# Dashboard is built into the landing page'),
     ].join('\n')
    },
    {title:'POST /donate',
     body: c=>[
       c.com('// From your product server — any language, any framework.'),
       c.com('// Call POST /donate whenever a user action should trigger one.'),
       '',
       `${c.kw('const')} res = ${c.kw('await')} ${c.fn('fetch')}(${c.str("'https://your-charity-server.com/donate'")}, {`,
       `  method: ${c.str("'POST'")},`,
       `  headers: { ${c.str("'Content-Type'")}: ${c.str("'application/json'")} },`,
       `  body: ${c.fn('JSON.stringify')}({ amount: ${c.str("'$0.001'")} }),`,
       '});',
       '',
       `${c.kw('const')} receipt = ${c.kw('await')} res.${c.fn('json')}();`,
       `console.${c.fn('log')}(receipt.txHash); ${c.com('// on-chain Solana signature')}`,
       '',
       c.com('// GET /donations returns JSON history (?limit=N up to 200)'),
     ].join('\n')
    }
  ];

  const cards = document.querySelectorAll('.step-card');
  const tabTitle = document.getElementById('codeTabTitle');
  const codeBody = document.getElementById('codeBody');
  const copyBtn  = document.getElementById('codeCopy');
  const copyTxt  = document.getElementById('codeCopyText');
  if(!cards.length || !tabTitle || !codeBody) return;

  const c = {
    com:s=>`<span class="com">${s}</span>`,
    kw: s=>`<span class="kw">${s}</span>`,
    str:s=>`<span class="str">${s}</span>`,
    num:s=>`<span class="num">${s}</span>`,
    fn: s=>`<span class="fn">${s}</span>`,
    var:s=>`<span class="var">${s}</span>`,
    punct:s=>`<span class="punct">${s}</span>`,
  };

  let cur = 0;
  function render(){
    cards.forEach((b,i)=>b.classList.toggle('on', i===cur));
    tabTitle.textContent = steps[cur].title;
    codeBody.innerHTML = steps[cur].body(c);
  }
  cards.forEach(b=>b.addEventListener('click',()=>{
    cur=parseInt(b.dataset.step,10);
    render();
  }));
  copyBtn.addEventListener('click', ()=>{
    const t = codeBody.innerText;
    navigator.clipboard?.writeText(t);
    copyBtn.classList.add('ok');
    copyTxt.textContent='Copied';
    setTimeout(()=>{copyBtn.classList.remove('ok');copyTxt.textContent='Copy';}, 1400);
  });
  render();
})();

/* ─── Use cases (static cards) ──────────────────────────── */
(function cases(){
  const root = document.getElementById('cases');
  if(!root) return;
  const data = [
    {key:'dex', title:'DEX & Trading', rate:'$0.001 per trade',
     body:'Donate a fraction of a cent on every swap or trade. 50K daily trades = $50/day to charity.',
     why:'Differentiate from competing DEXs. Traders prefer platforms that give back — boosting retention and word-of-mouth.',
     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h13l-3-3M21 17H8l3 3"/></svg>'},
    {key:'ai', title:'AI products & APIs', rate:'$0.001 per API call',
     body:'Attach a micro-donation to every API call or prompt. High-volume APIs add up fast.',
     why:'Improve brand image in a crowded AI market. "Every prompt helps someone" is a story users want to share.',
     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'},
    {key:'games', title:'Games', rate:'$0.001 per action',
     body:'Every level cleared, match played, or in-game action triggers a small donation.',
     why:'Increase player engagement and session time. Players feel good about playing — and tell their friends.',
     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 12h2m-1-1v2M15 12h.01M18 14h.01"/></svg>'},
    {key:'commerce', title:'E-commerce', rate:'$0.01 per order',
     body:'Round up every checkout or donate per order. Customers love brands that give back.',
     why:'Attract conscious consumers. 71% of buyers prefer brands that support social causes — higher conversion, lower churn.',
     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-2 9H8L6 4H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>'},
    {key:'bet', title:'Betting & predictions', rate:'$0.001 per bet',
     body:'Donate on every bet placed or market resolved. Turn speculation into impact.',
     why:'Soften public perception of betting platforms. Charitable giving builds trust with regulators and users alike.',
     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>'},
    {key:'pay', title:'Payments & banking', rate:'$0.001 per transaction',
     body:'Micro-donate on every transfer, bill payment, or card swipe processed by your platform.',
     why:'Stand out in fintech. On-chain donation receipts double as a transparency feature that builds customer loyalty.',
     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 11h20M6 16h3"/></svg>'},
  ];
  root.innerHTML = data.map(d=>`
    <div class="case">
      <div class="case-tile">${d.icon}</div>
      <h3>${d.title}</h3>
      <p>${d.body}</p>
      <span class="case-rate">${d.rate}</span>
      <div class="case-why"><b>Why it helps</b>${d.why}</div>
    </div>
  `).join('');
})();

/* ─── Dashboard: stats + wallets + history table ──────────────────── */
function renderDashboard(){
  const total = document.getElementById('dashTotal');
  const count = document.getElementById('dashCount');
  const delta = document.getElementById('dashDelta');
  const netEl = document.getElementById('dashNetwork');
  const netSub = document.getElementById('dashNetworkSub');
  const ctaCluster = document.getElementById('ctaCluster');
  const body  = document.getElementById('historyBody');
  if(!total) return;

  total.innerHTML = `$${fmtUsd(STORE.totalNum, {minimumFractionDigits:STORE.totalNum<1?4:2, maximumFractionDigits:STORE.totalNum<1?4:2})}<small>USDC</small>`;
  count.textContent = (STORE.count||0).toLocaleString();

  const hourCutoff = Date.now() - 60*60*1000;
  const lastHour = STORE.donations
    .filter(d=>d && d.timestamp && d.timestamp >= hourCutoff)
    .reduce((s,d)=>s+parseAmount(d.amount), 0);
  delta.textContent = `+ $${fmtUsd(lastHour, {minimumFractionDigits:2, maximumFractionDigits:4})} in last hour`;

  if(netEl){
    if(STORE.network==='solana-mainnet'){
      netEl.innerHTML = 'Solana <small>mainnet</small>';
    }else{
      netEl.innerHTML = 'Solana <small>devnet</small>';
    }
  }
  if(ctaCluster){
    ctaCluster.textContent = STORE.network==='solana-mainnet' ? 'Solana · Mainnet' : 'Solana · Devnet';
  }

  // Wallet cards
  const donationAddr = STORE.donorAddress;
  const donAddrEl    = document.getElementById('donationAddr');
  if(donAddrEl){
    if(donationAddr){
      donAddrEl.textContent = shortAddr(donationAddr);
      donAddrEl.dataset.full = donationAddr;
      document.getElementById('donationExpDevnet').href  = explorerForAddr('solana-devnet',  donationAddr);
      document.getElementById('donationExpMainnet').href = explorerForAddr('solana-mainnet', donationAddr);
    }else{
      donAddrEl.textContent = 'Not configured';
      donAddrEl.dataset.full = '';
    }
  }
  const donBals = STORE.donorBalances || {};
  setBal('donationDevnetUsdc',  donBals['solana-devnet']?.usdc);
  setBal('donationDevnetSol',   donBals['solana-devnet']?.sol);
  setBal('donationMainnetUsdc', donBals['solana-mainnet']?.usdc);
  setBal('donationMainnetSol',  donBals['solana-mainnet']?.sol);

  const charity = STORE.charity;
  if(charity){
    const addr = charity.walletAddress;
    const chAddrEl = document.getElementById('charityAddr');
    chAddrEl.textContent = shortAddr(addr);
    chAddrEl.dataset.full = addr || '';
    document.getElementById('charityName').textContent = charity.name || '—';
    document.getElementById('charityExpDevnet').href   = explorerForAddr('solana-devnet',  addr);
    document.getElementById('charityExpMainnet').href  = explorerForAddr('solana-mainnet', addr);
    const cbals = charity.balances || {};
    setBal('charityDevnetUsdc',  cbals['solana-devnet']?.usdc);
    setBal('charityDevnetSol',   cbals['solana-devnet']?.sol);
    setBal('charityMainnetUsdc', cbals['solana-mainnet']?.usdc);
    setBal('charityMainnetSol',  cbals['solana-mainnet']?.sol);
  }

  // History table
  if(!STORE.donations.length){
    body.innerHTML = '<tr><td colspan="6" class="history-empty">No donations yet — POST /donate to make the first one.</td></tr>';
  }else{
    const rows = STORE.donations.slice(0, 12).map(d=>{
      const sig = d.txHash || '';
      const txTxt = sig ? `<a href="${explorerForTx(d.chain, sig)}" target="_blank" rel="noopener">${shortSig(sig)}</a>` : '—';
      const status = (d.status==='ok' || !d.status) ? 'settled' : (d.status==='failed' ? 'failed' : d.status);
      return `<tr>
        <td><span class="h-id">${txTxt}</span></td>
        <td><span class="h-net"><img src="/assets/chain/solana.svg" alt=""/>${networkLabel(d.chain)}</span></td>
        <td>x402</td>
        <td><span class="h-st">${status}</span></td>
        <td class="h-when">${timeAgo(d.timestamp)}</td>
        <td class="h-amt">+$${parseAmount(d.amount).toFixed(3)}</td>
      </tr>`;
    }).join('');
    body.innerHTML = rows;
  }
}

function setBal(id, val){
  const el = document.getElementById(id);
  if(!el) return;
  if(val===undefined || val===null){ el.textContent = '—'; return; }
  const n = typeof val==='number' ? val : parseFloat(val);
  if(!isFinite(n)){ el.textContent = String(val); return; }
  el.textContent = n.toLocaleString('en-US', {minimumFractionDigits: n<1?4:2, maximumFractionDigits:4});
}

/* ─── Wire up Copy buttons + Refresh + initial load ───────────── */
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-copy]');
  if(!btn) return;
  const which = btn.dataset.copy;
  const span = which==='donation'
    ? document.getElementById('donationAddr')
    : document.getElementById('charityAddr');
  const full = span?.dataset.full;
  if(!full) return;
  navigator.clipboard?.writeText(full);
  btn.classList.add('ok');
  const prev = btn.textContent;
  btn.textContent = 'Copied';
  setTimeout(()=>{ btn.classList.remove('ok'); btn.textContent = prev; }, 1200);
});

document.getElementById('refreshBtn')?.addEventListener('click', ()=>{
  refreshAll();
});

// Initial load + periodic refresh
refreshAll();
setInterval(refreshAll, 30000);
