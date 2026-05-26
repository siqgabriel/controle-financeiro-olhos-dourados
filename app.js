/* ============================================================
   DUPLA FINANCEIRA — app.js
   ============================================================ */

// ── STATE ──────────────────────────────────────────────────
const STATE = {
    lancamentos: [],
    metas: { gabriel: 3000, gustavo: 3000, conjunto: 5000 }
};

function loadState() {
    try {
        const saved = localStorage.getItem('duplaFinanceira');
        if (saved) {
            const parsed = JSON.parse(saved);
            STATE.lancamentos = parsed.lancamentos || [];
            STATE.metas = parsed.metas || STATE.metas;
        }
    } catch (e) { }
}

function saveState() {
    localStorage.setItem('duplaFinanceira', JSON.stringify(STATE));
}

// ── HELPERS ────────────────────────────────────────────────
function fmt(val) {
    return 'R$ ' + Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtSigned(val) {
    const sign = val >= 0 ? '+' : '-';
    return sign + ' R$ ' + Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function mesLabel(dateStr) {
    if (!dateStr) return '—';
    const [y, m] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(m, 10) - 1] + '/' + y.slice(2);
}
function mesKey(dateStr) {
    if (!dateStr) return '';
    return dateStr.slice(0, 7);
}
function today() {
    return new Date().toISOString().slice(0, 10);
}
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── HAMBÚRGUER ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');

function closeMobileMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('open');
}

hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    mobileOverlay.classList.toggle('open', isOpen);
});

mobileOverlay.addEventListener('click', closeMobileMenu);

// ── NAVIGATION ─────────────────────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
const pages = document.querySelectorAll('.page');

function activateTab(tab) {
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    mobileNavBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + tab));
    renderAll();
}

navBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
mobileNavBtns.forEach(btn => btn.addEventListener('click', () => {
    activateTab(btn.dataset.tab);
    closeMobileMenu();
}));

// ── MODAL ──────────────────────────────────────────────────
let rowCount = 0;

function novaLinhaGasto() {
    rowCount++;
    const idx = rowCount;
    const div = document.createElement('div');
    div.className = 'gasto-row';
    div.id = 'row-' + idx;
    div.innerHTML = `
    <div class="gasto-row-header">
      <span class="gasto-row-title">Lançamento #${idx}</span>
      ${idx > 1 ? `<button class="btn-remove-row" onclick="removeRow(${idx})">✕ Remover</button>` : ''}
    </div>
    <div class="gasto-fields">
      <div class="field">
        <label>Valor (R$)</label>
        <input type="number" id="valor-${idx}" placeholder="0,00" min="0" step="0.01" />
      </div>
      <div class="field">
        <label>Tipo</label>
        <select id="tipo-${idx}">
          <option value="gasto">💸 Gasto</option>
          <option value="entrada">💰 Entrada / Receita</option>
        </select>
      </div>
      <div class="field field-full">
        <label>Descrição</label>
        <input type="text" id="desc-${idx}" placeholder="Ex: Almoço, Uber, Supermercado…" />
      </div>
      <div class="field">
        <label>Para quem?</label>
        <select id="pessoa-${idx}">
          <option value="gabriel">Gabriel</option>
          <option value="gustavo">Gustavo</option>
          <option value="conjunto">Conjunto</option>
        </select>
      </div>
      <div class="field">
        <label>Data</label>
        <input type="date" id="data-${idx}" value="${today()}" />
      </div>
    </div>
    <label class="boa-check">
      <input type="checkbox" id="boa-${idx}" />
      🍺 Isso conta como uma "boa"!
    </label>`;
    document.getElementById('gastosList').appendChild(div);
}

function removeRow(idx) {
    const row = document.getElementById('row-' + idx);
    if (row) row.remove();
}

document.getElementById('btnAddCusto').addEventListener('click', () => {
    document.getElementById('gastosList').innerHTML = '';
    rowCount = 0;
    novaLinhaGasto();
    document.getElementById('modalOverlay').classList.add('open');
});

document.getElementById('btnAddLinha').addEventListener('click', novaLinhaGasto);

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancelar').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.getElementById('btnSalvar').addEventListener('click', () => {
    const rows = document.querySelectorAll('.gasto-row');
    let salvou = 0;
    rows.forEach(row => {
        const id = row.id.replace('row-', '');
        const valor = parseFloat(document.getElementById('valor-' + id)?.value);
        const tipo = document.getElementById('tipo-' + id)?.value;
        const desc = document.getElementById('desc-' + id)?.value.trim();
        const pessoa = document.getElementById('pessoa-' + id)?.value;
        const data = document.getElementById('data-' + id)?.value;
        const boa = document.getElementById('boa-' + id)?.checked;
        if (!valor || valor <= 0 || !desc) return;
        STATE.lancamentos.push({ id: Date.now() + Math.random(), valor, tipo, desc, pessoa, data: data || today(), boa });
        salvou++;
    });
    if (salvou === 0) { showToast('⚠️ Preencha pelo menos um lançamento válido'); return; }
    saveState();
    closeModal();
    renderAll();
    showToast('✅ ' + salvou + ' lançamento' + (salvou > 1 ? 's salvos' : ' salvo') + '!');
});

// ── CÁLCULOS ───────────────────────────────────────────────
function calcSaldo(pessoa) {
    return STATE.lancamentos.filter(l => l.pessoa === pessoa)
        .reduce((acc, l) => l.tipo === 'entrada' ? acc + l.valor : acc - l.valor, 0);
}
function calcEntradas(pessoa) {
    return STATE.lancamentos.filter(l => l.pessoa === pessoa && l.tipo === 'entrada')
        .reduce((acc, l) => acc + l.valor, 0);
}
function calcGastos(pessoa) {
    return STATE.lancamentos.filter(l => l.pessoa === pessoa && l.tipo === 'gasto')
        .reduce((acc, l) => acc + l.valor, 0);
}
function calcBoas(pessoa) {
    return STATE.lancamentos.filter(l => l.boa && l.pessoa === pessoa).length;
}
function getMeses() {
    if (STATE.lancamentos.length === 0) {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return d.toISOString().slice(0, 7);
        });
    }
    return [...new Set(STATE.lancamentos.map(l => mesKey(l.data)))].sort();
}

// ── CHARTS REGISTRY ────────────────────────────────────────
const _charts = {};
function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}
function saveChart(id, inst) { _charts[id] = inst; }

// ── RENDER HOME ────────────────────────────────────────────
function renderHome() {
    // Cards
    ['gabriel', 'gustavo', 'conjunto'].forEach(p => {
        const saldo = calcSaldo(p);
        const meta = STATE.metas[p] || 3000;
        const key = p.charAt(0).toUpperCase() + p.slice(1);

        document.getElementById('saldo' + key).textContent = fmt(saldo);

        const statusEl = document.getElementById('status' + key);
        if (saldo > 0) { statusEl.textContent = '↑ Positivo'; statusEl.className = 'dash-card-status status-positivo'; }
        else if (saldo < 0) { statusEl.textContent = '↓ Negativo'; statusEl.className = 'dash-card-status status-negativo'; }
        else { statusEl.textContent = 'Zerado'; statusEl.className = 'dash-card-status status-neutro'; }

        const pct = Math.min(100, Math.max(0, Math.round((calcEntradas(p) / meta) * 100)));
        document.getElementById('meta' + key).textContent = 'Meta: ' + pct + '% atingida';
    });

    // Lista recente
    const recentes = [...STATE.lancamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10);
    renderLancamentos(document.getElementById('listaRecente'), recentes);

    // Gráficos
    renderChartGeral();
    renderChartPizza();
}

// Gráfico de Linhas
function renderChartGeral() {
    const ctx = document.getElementById('chartGeral');
    if (!ctx) return;
    destroyChart('geral');
    const meses = getMeses();
    const defs = [
        { pessoa: 'gabriel', label: 'Gabriel', color: '#1a6cf6' },
        { pessoa: 'gustavo', label: 'Gustavo', color: '#e0471d' },
        { pessoa: 'conjunto', label: 'Conjunto', color: '#0f9e6e' }
    ];
    saveChart('geral', new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses.map(m => mesLabel(m + '-01')),
            datasets: defs.map(d => ({
                label: d.label,
                data: meses.map(m => {
                    return STATE.lancamentos
                        .filter(l => l.pessoa === d.pessoa && mesKey(l.data) === m)
                        .reduce((acc, l) => l.tipo === 'entrada' ? acc + l.valor : acc - l.valor, 0);
                }),
                borderColor: d.color,
                backgroundColor: d.color + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: d.color
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmtSigned(ctx.raw) } } },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, callback: v => 'R$ ' + v.toLocaleString('pt-BR') } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    }));
}

// Gráfico de Pizza
function renderChartPizza() {
    const ctx = document.getElementById('chartPizza');
    const legendEl = document.getElementById('pizzaLegend');
    if (!ctx || !legendEl) return;
    destroyChart('pizza');

    const gastosGabriel = calcGastos('gabriel');
    const gastosGustavo = calcGastos('gustavo');
    const gastosConjunto = calcGastos('conjunto');
    const total = gastosGabriel + gastosGustavo + gastosConjunto;

    if (total === 0) {
        legendEl.innerHTML = '<p class="pizza-empty">Nenhum gasto registrado ainda.</p>';
        ctx.style.display = 'none';
        return;
    }

    ctx.style.display = '';

    const labels = ['Gabriel', 'Gustavo', 'Conjunto'];
    const dados = [gastosGabriel, gastosGustavo, gastosConjunto];
    const cores = ['#1a6cf6', '#e0471d', '#0f9e6e'];

    saveChart('pizza', new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: dados,
                backgroundColor: cores.map(c => c + 'cc'),
                borderColor: cores,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                            return ' ' + fmt(ctx.raw) + ' (' + pct + '%)';
                        }
                    }
                }
            }
        }
    }));

    // Legenda customizada
    legendEl.innerHTML = labels.map((l, i) => {
        const pct = total > 0 ? ((dados[i] / total) * 100).toFixed(1) : 0;
        if (dados[i] === 0) return '';
        return `
      <div class="pizza-legend-item">
        <div class="pizza-legend-left">
          <span class="pizza-dot" style="background:${cores[i]}"></span>
          <span>${l}</span>
        </div>
        <span class="pizza-legend-val">${fmt(dados[i])} <span style="color:var(--clr-muted);font-weight:400">(${pct}%)</span></span>
      </div>`;
    }).filter(Boolean).join('');
}

// ── RENDER PESSOA ──────────────────────────────────────────
function renderPessoa(pessoa) {
    const pfx = pessoa === 'gabriel' ? 'g' : pessoa === 'gustavo' ? 'gu' : 'c';
    const entradas = calcEntradas(pessoa);
    const gastos = calcGastos(pessoa);
    const saldo = calcSaldo(pessoa);
    const boas = calcBoas(pessoa);

    document.getElementById(pfx + '-entradas').textContent = fmt(entradas);
    document.getElementById(pfx + '-gastos').textContent = fmt(gastos);
    const saldoEl = document.getElementById(pfx + '-saldo');
    saldoEl.textContent = fmt(saldo);
    saldoEl.className = 'metric-value ' + (saldo >= 0 ? 'green' : 'red');
    if (pfx !== 'c') {
        document.getElementById(pfx + '-boas').textContent = boas + (boas === 1 ? ' boa' : ' boas');
    }

    // extrato
    const extratoEl = document.getElementById('extrato' + capitalize(pessoa));
    const lancs = STATE.lancamentos.filter(l => l.pessoa === pessoa).sort((a, b) => b.data.localeCompare(a.data));
    renderLancamentos(extratoEl, lancs);

    // chart barras
    const meses = getMeses();
    const color = pessoa === 'gabriel' ? '#1a6cf6' : pessoa === 'gustavo' ? '#e0471d' : '#0f9e6e';
    const canvasId = 'chart' + capitalize(pessoa);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    destroyChart(canvasId);
    saveChart(canvasId, new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses.map(m => mesLabel(m + '-01')),
            datasets: [
                {
                    label: 'Entradas',
                    data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === pessoa && mesKey(l.data) === m && l.tipo === 'entrada').reduce((a, l) => a + l.valor, 0)),
                    backgroundColor: color + '55', borderColor: color, borderWidth: 2
                },
                {
                    label: 'Gastos',
                    data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === pessoa && mesKey(l.data) === m && l.tipo === 'gasto').reduce((a, l) => a + l.valor, 0)),
                    backgroundColor: '#e0471d33', borderColor: '#e0471d', borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { font: { size: 12 } } } },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR'), font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    }));
}

// ── RENDER LANÇAMENTOS ─────────────────────────────────────
function renderLancamentos(container, lancs) {
    if (!container) return;
    if (!lancs.length) {
        container.innerHTML = '<p class="empty-state">Nenhum lançamento ainda.</p>';
        return;
    }
    const avatarMap = {
        gabriel: { cls: 'avatar-gabriel', initials: 'GB' },
        gustavo: { cls: 'avatar-gustavo', initials: 'GU' },
        conjunto: { cls: 'avatar-conjunto', initials: 'CJ' }
    };
    container.innerHTML = lancs.map(l => {
        const av = avatarMap[l.pessoa] || { cls: '', initials: '?' };
        const valClass = l.tipo === 'entrada' ? 'entrada' : 'gasto';
        const valSign = l.tipo === 'entrada' ? '+' : '-';
        const boaBadge = l.boa ? '<span class="lanc-boa-badge">🍺 boa</span>' : '';
        return `
      <div class="lancamento-item">
        <div class="lanc-left">
          <div class="lanc-avatar ${av.cls}">${av.initials}</div>
          <div class="lanc-info">
            <div class="lanc-desc">${escapeHtml(l.desc)}</div>
            <div class="lanc-meta">${l.data} · ${capitalize(l.pessoa)}</div>
          </div>
        </div>
        <div class="lanc-right">
          <span class="lanc-valor ${valClass}">${valSign} ${fmt(l.valor)}</span>
          ${boaBadge}
        </div>
      </div>`;
    }).join('');
}

// ── RENDER RANKING ─────────────────────────────────────────
function renderRanking() {
    const boasGabriel = calcBoas('gabriel');
    const boasGustavo = calcBoas('gustavo');
    const sorted = [
        { nome: 'Gabriel', count: boasGabriel },
        { nome: 'Gustavo', count: boasGustavo }
    ].sort((a, b) => b.count - a.count);

    document.getElementById('rank1-nome').textContent = sorted[0].nome;
    document.getElementById('rank1-count').textContent = sorted[0].count + (sorted[0].count === 1 ? ' boa' : ' boas');
    document.getElementById('rank2-nome').textContent = sorted[1].nome;
    document.getElementById('rank2-count').textContent = sorted[1].count + (sorted[1].count === 1 ? ' boa' : ' boas');

    const meses = getMeses();
    const mensalEl = document.getElementById('rankingMensal');
    if (!meses.length || (boasGabriel + boasGustavo === 0)) {
        mensalEl.innerHTML = '<p class="empty-state">Nenhuma "boa" registrada ainda. Vai lá pagar uma rodada! 🍻</p>';
    } else {
        const rows = [...meses].reverse().map(m => {
            const gab = STATE.lancamentos.filter(l => l.boa && l.pessoa === 'gabriel' && mesKey(l.data) === m).length;
            const gus = STATE.lancamentos.filter(l => l.boa && l.pessoa === 'gustavo' && mesKey(l.data) === m).length;
            if (gab + gus === 0) return '';
            const winner = gab > gus ? 'Gabriel' : gus > gab ? 'Gustavo' : 'Empate';
            return `
        <div class="mes-card">
          <span class="mes-label">${mesLabel(m + '-01')}</span>
          <div class="mes-bar-wrap">
            <span class="mes-bar-item"><span class="mes-dot mes-dot-gabriel"></span>Gabriel: ${gab}</span>
            <span class="mes-bar-item"><span class="mes-dot mes-dot-gustavo"></span>Gustavo: ${gus}</span>
          </div>
          <span class="mes-winner-badge">${winner === 'Empate' ? '🤝 Empate' : '🏆 ' + winner}</span>
        </div>`;
        }).filter(Boolean).join('');
        mensalEl.innerHTML = rows || '<p class="empty-state">Nenhuma boa nesse período.</p>';
    }

    const boas = STATE.lancamentos.filter(l => l.boa).sort((a, b) => b.data.localeCompare(a.data));
    renderLancamentos(document.getElementById('rankingHistorico'), boas);
}

// ── RENDER ALL ─────────────────────────────────────────────
function renderAll() {
    const active = document.querySelector('.page.active');
    if (!active) return;
    const id = active.id;
    if (id === 'page-home') renderHome();
    if (id === 'page-gabriel') renderPessoa('gabriel');
    if (id === 'page-gustavo') renderPessoa('gustavo');
    if (id === 'page-conjuntos') renderPessoa('conjunto');
    if (id === 'page-ranking') renderRanking();
}

// ── INIT ───────────────────────────────────────────────────
loadState();
renderAll();