// ==========================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==========================================
const cv = document.getElementById('c');
const g = cv.getContext('2d');
const $ = (id) => document.getElementById(id);

const W = 320, H = 184;
const PX = 16, PY = 12, PW = 288, PH = 160;
const PR = PX + PW, PB = PY + PH, CY = PY + PH / 2;
const GH = 40;

// Níveis de Dificuldade
const LV = {
    facil: { n: 'FÁCIL', spd: 40, err: 0.4 },
    medio: { n: 'MÉDIO', spd: 60, err: 0.2 },
    dificil: { n: 'DIFÍCIL', spd: 85, err: 0.05 }
};
let AP = LV.medio;

// Estado do Jogo
let state = 'menu';
let score = [0, 0];
let time = 120;
let gt = 0, pk = 0;

let keys = {};
let mouse = { x: W / 2, y: H / 2 };
let act = { pass: false, shot: false };

let ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
let all = [];
let ctrl = null;

// ==========================================
// CRIAÇÃO E REINICIALIZAÇÃO DE OBJETOS
// ==========================================
function build() {
    all = [
        { x: PX + 40, y: CY, vx: 0, vy: 0, team: 0, fx: 1, fy: 0 },
        { x: PR - 40, y: CY, vx: 0, vy: 0, team: 1, fx: -1, fy: 0 }
    ];
    ctrl = all[0];
}

function reset(teamScored) {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = 0;
    ball.vy = 0;
    all[0].x = PX + 40; all[0].y = CY;
    all[1].x = PR - 40; all[1].y = CY;
}

function endGame() {
    state = 'menu';
    const menu = $('menu');
    if (menu) {
        menu.hidden = false;
        menu.style.display = '';
    }
    $('mt').textContent = 'FIM DE JOGO';$('mm').textContent = `Placar Final: ${score[0]} x ${score[1]}`;
}

// ==========================================
// FÍSICA E ATUALIZAÇÃO (STEP)
// ==========================================
function step(dt) {
    // Controles do Jogador
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    const len = Math.hypot(dx, dy);
    if (len > 0) {
        ctrl.vx = (dx / len) * 70;
        ctrl.vy = (dy / len) * 70;
    } else {
        ctrl.vx = 0;
        ctrl.vy = 0;
    }

    // Direção da olhada (Mouse)
    const mdx = mouse.x - ctrl.x;
    const mdy = mouse.y - ctrl.y;
    const mlen = Math.hypot(mdx, mdy) || 1;
    ctrl.fx = mdx / mlen;
    ctrl.fy = mdy / mlen;

    // Chute / Passe
    const distBall = Math.hypot(ball.x - ctrl.x, ball.y - ctrl.y);
    if (distBall < 8) {
        if (act.shot) {
            ball.vx = ctrl.fx * 180;
            ball.vy = ctrl.fy * 180;
        } else if (act.pass) {
            ball.vx = ctrl.fx * 100;
            ball.vy = ctrl.fy * 100;
        }
    }
    act.shot = false;
    act.pass = false;

    // IA Simples (Robô)
    const bot = all[1];
    const bdx = ball.x - bot.x;
    const bdy = ball.y - bot.y;
    const blen = Math.hypot(bdx, bdy) || 1;
    bot.vx = (bdx / blen) * AP.spd;
    bot.vy = (bdy / blen) * AP.spd;
    bot.fx = bdx / blen;
    bot.fy = bdy / blen;

    // Movimentação dos personagens
    all.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.x = Math.max(PX + 4, Math.min(PR - 4, p.x));
        p.y = Math.max(PY + 4, Math.min(PB - 4, p.y));
    });

    // Atualização e Fricção da Bola
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.vx *= 0.96;
    ball.vy *= 0.96;

    // Colisão da Bola nas Paredes
    if (ball.x < PX + 2 || ball.x > PR - 2) {
        if (ball.y > CY - GH / 2 && ball.y < CY + GH / 2) {
            // Gol!
            if (ball.x < PX + 2) score[1]++;
            else score[0]++;
            
            pk = ball.x < PX + 2 ? 0 : 1;
            state = 'goal';
            gt = 1.5;
            $('gl').hidden = false;
        } else {
            ball.vx *= -1;
            ball.x = Math.max(PX + 2, Math.min(PR - 2, ball.x));
        }
    }
    if (ball.y < PY + 2 || ball.y > PB - 2) {
        ball.vy *= -1;
        ball.y = Math.max(PY + 2, Math.min(PB - 2, ball.y));
    }
}

// ==========================================
// RENDERIZAÇÃO (DRAW)
// ==========================================
function draw() {
    // Campo
    g.fillStyle = '#2b5f31';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.4)';
    g.lineWidth = 1;
    g.strokeRect(PX, PY, PW, PH);
    
    // Linha Central e Círculo
    g.beginPath();
    g.moveTo(PX + PW / 2, PY);
    g.lineTo(PX + PW / 2, PB);
    g.stroke();
    g.beginPath();
    g.arc(PX + PW / 2, CY, 25, 0, Math.PI * 2);
    g.stroke();

    // Traves
    g.fillStyle = '#17261a';
    g.fillRect(PX - 4, CY - GH / 2, 4, GH);
    g.fillRect(PR, CY - GH / 2, 4, GH);

    // Jogadores
    all.forEach(p => {
        g.fillStyle = p.team ? '#ff5d5d' : (p === ctrl ? '#2f6fe0' : '#ffffff');
        g.beginPath();
        g.arc(p.x, p.y, 4, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        
        // Direção dos Olhos
        g.fillStyle = '#000';
        g.fillRect(p.x - 0.5 + p.fx * 2, p.y - 0.5 + p.fy * 2, 1.5, 1.5);
    });

    // Bola
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(ball.x, ball.y, 2, 0, Math.PI * 2);
    g.fill();
    g.stroke();

    // HUD
    $('sc').textContent = score[0] + ' x ' + score[1];
    let m = Math.floor(time / 60), s = Math.floor(time % 60);
    $('tm').textContent = m + ':' + (s < 10 ? '0' : '') + s;
}

// ==========================================
// LOOP DE JOGO E EVENTOS
// ==========================================
let lastT = performance.now();
function loop(t) {
    let dt = (t - lastT) / 1000;
    lastT = t;
    if (dt > 0.1) dt = 0.1;

    if (state === 'play') {
        time -= dt;
        if (time <= 0) {
            time = 0;
            endGame();
        }
        step(dt);
    } else if (state === 'goal') {
        step(dt * 0.2);
        gt -= dt;
        if (gt <= 0) {
            $('gl').hidden = true;
            state = 'play';
            reset(pk);
        }
    }
    
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') act.pass = true;
    if (e.code === 'Escape') {
        state = 'menu';
        const menu = $('menu');
        if (menu) {
            menu.hidden = false;
            menu.style.display = '';
        }
    }
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
});

cv.addEventListener('mousedown', e => {
    if (e.button === 0) act.shot = true;
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
function inicializarJogo() {
    const fsBtn = document.getElementById('fs-btn');
    if (fsBtn) {
        fsBtn.onclick = () => {
            const elem = document.getElementById('wrap') || document.documentElement;
            if (!document.fullscreenElement) {
                if (elem.requestFullscreen) elem.requestFullscreen();
                else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        };
    }

    const botoesMenu = document.querySelectorAll('button[data-l]');
    botoesMenu.forEach(btn => {
        btn.onclick = () => {
            const nivel = btn.getAttribute('data-l');
            if (LV[nivel]) {
                AP = LV[nivel];
                const labelDificuldade = document.getElementById('lv');
                if (labelDificuldade) labelDificuldade.textContent = AP.n;
            }
            score = [0, 0];
            time = 120;
            state = 'play';
            build();
            reset(0);
            
            const menuInicial = document.getElementById('menu');
            if (menuInicial) {
                menuInicial.hidden = true;
                menuInicial.style.display = 'none';
            }
            if (cv) cv.focus();
        };
    });

    build();
    requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarJogo);
} else {
    inicializarJogo();
}