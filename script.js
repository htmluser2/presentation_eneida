(function(){
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const counted = total - 1;
  let current = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cursor = document.getElementById('cursor');
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('button, .chip, .dot').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
  });

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  function makeParticle(){
    return { x: Math.random()*W, y: H + Math.random()*40, r: 1 + Math.random()*2.2,
      vy: .25 + Math.random()*.5, vx: (Math.random()-.5)*.25, a: .25 + Math.random()*.5 };
  }
  for (let i=0;i<50;i++){ const p = makeParticle(); p.y = Math.random()*H; particles.push(p); }
  function tick(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      p.y -= p.vy; p.x += p.vx;
      if (p.y < -10) Object.assign(p, makeParticle());
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
      g.addColorStop(0, `rgba(228,196,120,${p.a})`);
      g.addColorStop(1, 'rgba(228,196,120,0)');
      ctx.fillStyle = g;
      ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2);
      ctx.fill();
    });
    if (!reduced) requestAnimationFrame(tick);
  }
  tick();

  document.querySelectorAll('.tilt-card, .humor-card').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5;
      const y = (e.clientY - r.top)/r.height - .5;
      el.style.transform = `rotateY(${x*8}deg) rotateX(${-y*8}deg) translateZ(6px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  function buildOdometer(el){
    const target = String(el.dataset.target);
    const cycles = 3;
    el.innerHTML = '';
    [...target].forEach(chStr => {
      const digit = parseInt(chStr, 10);
      const box = document.createElement('span');
      box.className = 'odo-digit';
      const strip = document.createElement('span');
      strip.className = 'odo-strip';
      const totalSteps = cycles * 10 + digit;
      let html = '';
      for (let i = 0; i <= totalSteps; i++) html += `<span class="odo-num">${i % 10}</span>`;
      strip.innerHTML = html;
      box.appendChild(strip);
      el.appendChild(box);
    });
  }
  function spinOdometer(el){
    el.querySelectorAll('.odo-strip').forEach((strip, idx) => {
      const steps = strip.children.length;
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      void strip.offsetWidth;
      strip.style.transition = `transform 1.35s cubic-bezier(.22,.9,.28,1) ${idx*0.07}s`;
      strip.style.transform = `translateY(-${steps-1}em)`;
    });
  }
  document.querySelectorAll('.odo[data-target]').forEach(buildOdometer);

  const compare = document.getElementById('compare');
  const newPane = document.getElementById('newPane');
  const handle = document.getElementById('handle');
  let dragging = false;
  let didDrag = false;
  function setSplit(clientX){
    const rect = compare.getBoundingClientRect();
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(6, Math.min(94, percent));
    newPane.style.clipPath = `inset(0 0 0 ${percent}%)`;
    handle.style.left = percent + '%';
  }
  if (compare){
    compare.addEventListener('pointerdown', e => {
      dragging = true;
      didDrag = false;
      compare.setPointerCapture(e.pointerId);
      setSplit(e.clientX);
      e.stopPropagation();
    });
    compare.addEventListener('pointermove', e => {
      if (!dragging) return;
      didDrag = true;
      setSplit(e.clientX);
      e.stopPropagation();
    });
    compare.addEventListener('pointerup', e => {
      dragging = false;
      if (compare.hasPointerCapture(e.pointerId)) compare.releasePointerCapture(e.pointerId);
      e.stopPropagation();
    });
    compare.addEventListener('pointercancel', () => { dragging = false; });
    compare.addEventListener('click', e => {
      e.stopPropagation();
      if (didDrag) {
        e.preventDefault();
        didDrag = false;
      }
    });
  }

  function playSig(){
    document.querySelectorAll('#sigFlow .sig-item').forEach((el,i) => {
      el.classList.remove('in');
      setTimeout(() => el.classList.add('in'), 160*i);
    });
  }

  function onEnter(id){
    if (id === 's2') document.querySelectorAll('#s2 .odo').forEach(spinOdometer);
    if (id === 's3') { const c = document.querySelector('#s3 .count.odo'); if (c) spinOdometer(c); }
    if (id === 's7') playSig();
    if (id === 's9') burstConfetti();
  }

  const dotsEl = document.getElementById('dots');
  for (let i=0;i<counted;i++){
    const d = document.createElement('div');
    d.className = 'dot' + (i===0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  }
  const dots = Array.from(dotsEl.children);
  const progress = document.getElementById('progress');
  const counter = document.getElementById('counter');
  function pad(n){ return n<10 ? '0'+n : ''+n; }

  function goTo(index){
    if (index === current || index < 0 || index >= total) return;
    const curEl = slides[current], nxtEl = slides[index];
    curEl.classList.remove('active');
    nxtEl.classList.add('active');
    current = index;
    if (index < counted){
      dots.forEach((d,i) => d.classList.toggle('active', i===current));
      progress.style.width = ((current+1)/counted*100) + '%';
      counter.textContent = pad(current+1) + ' / ' + pad(counted);
    } else {
      progress.style.width = '100%';
      counter.textContent = '';
    }
    setTimeout(() => onEnter(nxtEl.id), 250);
  }

  document.getElementById('prevBtn').addEventListener('click', () => goTo(current-1));
  document.getElementById('nextBtn').addEventListener('click', () => goTo(current+1));
  document.getElementById('scrollcue').addEventListener('click', () => goTo(current+1));
  document.addEventListener('keydown', e => {
    if (['ArrowRight','ArrowDown',' ','PageDown'].includes(e.key)) { e.preventDefault(); goTo(current+1); }
    if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); goTo(current-1); }
  });
  document.getElementById('deck').addEventListener('click', e => {
    if (e.target.closest('.navbtn,.dot,.chip,#scrollcue,.compare')) return;
    const x = e.clientX / window.innerWidth;
    if (x > .8) goTo(current+1); else if (x < .2) goTo(current-1);
  });

  let touchX = null;
  document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; });
  document.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? goTo(current+1) : goTo(current-1); }
    touchX = null;
  });

  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  });
  document.getElementById('deck').addEventListener('mousemove', e => {
    const active = document.querySelector('.slide.active .slide-inner');
    if (!active) return;
    const x = (e.clientX / window.innerWidth - .5) * 2;
    const y = (e.clientY / window.innerHeight - .5) * 2;
    active.style.transform = `rotateY(${x*1.6}deg) rotateX(${-y*1.6}deg)`;
  });

  const confettiCanvas = document.getElementById('confetti');
  const cctx = confettiCanvas.getContext('2d');
  function resizeConfetti(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
  resizeConfetti(); window.addEventListener('resize', resizeConfetti);
  function burstConfetti(){
    if (reduced) return;
    const colors = ['#D4A445', '#E8C87A', '#FBF3EA', '#C21B31'];
    const parts = [];
    for (let i=0;i<160;i++) parts.push({x:Math.random()*confettiCanvas.width,y:-20-Math.random()*220,w:5+Math.random()*6,h:9+Math.random()*7,vy:2.2+Math.random()*3,vx:(Math.random()-.5)*2.4,rot:Math.random()*360,vr:(Math.random()-.5)*12,color:colors[Math.floor(Math.random()*colors.length)],life:0});
    const t0 = performance.now();
    (function frame(t){
      cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); let alive = false;
      parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++; if (p.y < confettiCanvas.height + 30) alive = true; cctx.save(); cctx.translate(p.x,p.y); cctx.rotate(p.rot*Math.PI/180); cctx.fillStyle=p.color; cctx.globalAlpha=Math.max(0,1-p.life/280); cctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); cctx.restore(); });
      if (alive && t-t0 < 5200) requestAnimationFrame(frame); else cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    })(t0);
  }

  slides[0].classList.add('active');
  progress.style.width = (1/counted*100) + '%';
  counter.textContent = pad(1) + ' / ' + pad(counted);
})();
