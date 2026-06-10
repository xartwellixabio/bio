const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(pointer: fine)').matches;

const cur = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

if (FINE) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cur.style.transform = `translate(${mx}px, ${my}px)`;
  });

  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a, button, input, .lang-panel, .about-tags span').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

const progress = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const k = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
  progress.style.width = (k * 100) + '%';
}, { passive: true });

const clock = document.getElementById('clock');
function tickClock() {
  clock.textContent = new Date().toLocaleTimeString('ru-RU', { hour12: false });
}
tickClock();
setInterval(tickClock, 1000);

const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const typedEl = document.getElementById('typed');
const phrases = [
  'сестра хартвелла',
  'кодер из вредности',
  'проблема (по версии брата)',
  'alt till death'
];

if (RM) {
  typedEl.textContent = phrases[0];
} else {
  let pi = 0, ci = 0, del = false;
  (function typeLoop() {
    const p = phrases[pi];
    typedEl.textContent = p.slice(0, ci);
    let wait = del ? 35 : 75;
    if (!del && ci === p.length) { wait = 1800; del = true; }
    else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
    else ci += del ? -1 : 1;
    setTimeout(typeLoop, wait);
  })();
}

const out = document.getElementById('term-out');
const inp = document.getElementById('term-input');
const body = document.getElementById('term-body');
let busy = false;
const PROMPT = 'хартвеллиха@github:~$ ';

function addLine(cls) {
  const d = document.createElement('div');
  d.className = 't-line' + (cls ? ' t-line--' + cls : '');
  out.appendChild(d);
  out.scrollTop = out.scrollHeight;
  return d;
}

function echo(cmd) {
  const d = addLine();
  const p = document.createElement('span');
  p.className = 't-prompt';
  p.textContent = PROMPT;
  d.appendChild(p);
  d.appendChild(document.createTextNode(cmd));
}

function typeOut(text, cls) {
  return new Promise(res => {
    const d = addLine(cls);
    if (RM) { d.textContent = text; res(); return; }
    let i = 0;
    (function tick() {
      d.textContent = text.slice(0, ++i);
      out.scrollTop = out.scrollHeight;
      if (i < text.length) setTimeout(tick, 12);
      else res();
    })();
  });
}

async function printAll(lines) {
  busy = true;
  for (const [t, c] of lines) await typeOut(t, c);
  busy = false;
  out.scrollTop = out.scrollHeight;
}

const HELP = [
  ['доступные команды:', 'dim'],
  ['  whoami     кто это вообще', ''],
  ['  языки      чем пишу', ''],
  ['  брат       информация о нём', ''],
  ['  время      который час', ''],
  ['  clear      стереть всё', ''],
  ['  exit       попробовать сбежать', ''],
  ['остальное вводи на свой страх', 'dim']
];

function respond(raw) {
  const cmd = raw.toLowerCase().trim();
  if (cmd === 'clear' || cmd === 'cls' || cmd === 'очисти') return 'CLEAR';
  if (cmd === 'help' || cmd === 'помощь' || cmd === 'справка') return HELP;
  if (cmd === 'whoami' || cmd === 'кто я' || cmd === 'кто ты' || cmd === 'ктоя')
    return [['хартвеллиха. сестра хартвелла. этого достаточно', 'red']];
  if (cmd === 'языки' || cmd === 'skills' || cmd === 'скилы' || cmd === 'ls')
    return [['c++ · python · c# · bash · sql · html/css · git', ''], ['подробности ниже. листай', 'dim']];
  if (cmd === 'брат' || cmd === 'hartwell' || cmd === 'хартвелл')
    return [['говорит что я проблема', ''], ['он просто завидует', 'vio']];
  if (cmd === 'время' || cmd === 'time' || cmd === 'date' || cmd === 'дата')
    return [[new Date().toLocaleString('ru-RU'), 'ok']];
  if (cmd === 'привет' || cmd === 'hi' || cmd === 'hello' || cmd === 'ку' || cmd === 'здарова')
    return [['ну привет. чего надо', '']];
  if (cmd === 'exit' || cmd === 'quit' || cmd === 'выход')
    return [['отсюда нет выхода', 'red']];
  if (cmd === 'хартвеллиха') return [['это я', '']];
  if (cmd === 'не трогай') return [['поздно. ты уже в моём терминале', 'red']];
  if (cmd === 'люблю тебя' || cmd === 'love')
    return [['ошибка 403: доступ запрещён', 'red']];
  if (cmd.startsWith('sudo')) return [['нет.', 'red']];
  if (cmd.startsWith('rm')) return [['смело. но нет', 'red']];
  if (cmd === '') return [];
  return [['команда не найдена: ' + cmd, 'dim'], ['попробуй help', 'dim']];
}

inp.addEventListener('keydown', async e => {
  if (e.key !== 'Enter' || busy) return;
  const raw = inp.value;
  inp.value = '';
  echo(raw);
  const r = respond(raw);
  if (r === 'CLEAR') { out.innerHTML = ''; return; }
  if (r.length) await printAll(r);
});

body.addEventListener('click', e => {
  if (e.target !== inp && window.getSelection().toString() === '') inp.focus();
});

const BOOT = [
  ['загрузка ядра вредности ......... ok', 'ok'],
  ['поиск совести ................... not found', 'red'],
  ['подключение к брату ............. отказано', 'dim'],
  ['статус: жива. к сожалению для вас', 'vio'],
  ['введи help. если осмелишься', 'dim']
];

let booted = false;
const termIo = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting && !booted) {
      booted = true;
      printAll(BOOT);
      termIo.disconnect();
    }
  });
}, { threshold: 0.3 });
termIo.observe(document.getElementById('terminal'));

if (FINE && !RM) {
  document.querySelectorAll('.lang-panel').forEach(p => {
    p.addEventListener('mousemove', e => {
      const r = p.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      p.style.setProperty('--mx', (x * 100) + '%');
      p.style.setProperty('--my', (y * 100) + '%');
      p.style.transition = 'transform 60ms linear, border-color 0.35s, box-shadow 0.35s';
      p.style.transform = `perspective(700px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg) translateY(-3px)`;
    });
    p.addEventListener('mouseleave', () => {
      p.style.transition = 'transform 0.4s ease, border-color 0.35s, box-shadow 0.35s';
      p.style.transform = '';
    });
  });
}

function animCount(el) {
  const to = +el.dataset.to;
  const from = +(el.dataset.from || 0);
  if (RM) { el.textContent = to.toLocaleString('ru-RU'); return; }
  const dur = 1500;
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e).toLocaleString('ru-RU');
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

const cntIo = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      animCount(en.target);
      cntIo.unobserve(en.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('.stat__num[data-to]').forEach(el => cntIo.observe(el));
