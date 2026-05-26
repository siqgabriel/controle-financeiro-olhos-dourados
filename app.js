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
  } catch (e) { /* primeira vez */ }
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
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return months[parseInt(m, 10) - 1] + '/' + y.slice(2);
}

function mesKey(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 7); // YYYY-MM
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

// ── NAVIGATION ─────────────────────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const pages   = document.querySelectorAll('.page');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + tab).classList.add('active');
    renderAll();
  });
});

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
      <div class="field field-tipo">
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
    </label>
  `;
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

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.getElementById('btnSalvar').addEventListener('click', () => {
  const rows = document.querySelectorAll('.gasto-row');
  let salvou = 0;

  rows.forEach(row => {
    const id = row.id.replace('row-', '');
    const valor  = parseFloat(document.getElementById('valor-' + id)?.value);
    const tipo   = document.getElementById('tipo-' + id)?.value;
    const desc   = document.getElementById('desc-' + id)?.value.trim();
    const pessoa = document.getElementById('pessoa-' + id)?.value;
    const data   = document.getElementById('data-' + id)?.value;
    const boa    = document.getElementById('boa-' + id)?.checked;

    if (!valor || valor <= 0 || !desc) return;

    STATE.lancamentos.push({
      id: Date.now() + Math.random(),
      valor,
      tipo,
      desc,
      pessoa,
      data: data || today(),
      boa
    });
    salvou++;
  });

  if (salvou === 0) {
    showToast('⚠️ Preencha pelo menos um lançamento válido');
    return;
  }

  saveState();
  closeModal();
  renderAll();
  showToast('✅ ' + salvou + ' lançamento' + (salvou > 1 ? 's salvos' : ' salvo') + '!');
});

// ── CÁLCULOS ───────────────────────────────────────────────
function calcSaldo(pessoa) {
  return STATE.lancamentos
    .filter(l => l.pessoa === pessoa)
    .reduce((acc, l) => {
      return l.tipo === 'entrada' ? acc + l.valor : acc - l.valor;
    }, 0);
}

function calcEntradas(pessoa) {
  return STATE.lancamentos
    .filter(l => l.pessoa === pessoa && l.tipo === 'entrada')
    .reduce((acc, l) => acc + l.valor, 0);
}

function calcGastos(pessoa) {
  return STATE.lancamentos
    .filter(l => l.pessoa === pessoa && l.tipo === 'gasto')
    .reduce((acc, l) => acc + l.valor, 0);
}

function calcBoas(pessoa) {
  return STATE.lancamentos.filter(l => l.boa && l.pessoa === pessoa).length;
}

// ── RENDER HOME ────────────────────────────────────────────
let chartGeralInst = null;

function renderHome() {
  ['gabriel', 'gustavo', 'conjunto'].forEach(p => {
    const saldo = calcSaldo(p);
    const meta  = STATE.metas[p] || 3000;

    document.getElementById('saldo' + p.charAt(0).toUpperCase() + p.slice(1)).textContent = fmt(saldo);

    const statusEl = document.getElementById('status' + p.charAt(0).toUpperCase() + p.slice(1));
    if (saldo > 0) {
      statusEl.textContent = '↑ Positivo';
      statusEl.className = 'dash-card-status status-positivo';
    } else if (saldo < 0) {
      statusEl.textContent = '↓ Negativo';
      statusEl.className = 'dash-card-status status-negativo';
    } else {
      statusEl.textContent = 'Zerado';
      statusEl.className = 'dash-card-status status-neutro';
    }

    const metaEl = document.getElementById('meta' + p.charAt(0).toUpperCase() + p.slice(1));
    const pct = Math.min(100, Math.max(0, Math.round((calcEntradas(p) / meta) * 100)));
    metaEl.textContent = 'Meta: ' + pct + '% atingida';
  });

  // Lista recente
  const listaEl = document.getElementById('listaRecente');
  const recentes = [...STATE.lancamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10);
  renderLancamentos(listaEl, recentes);

  // Chart geral
  renderChartGeral();
}

function renderChartGeral() {
  const ctx = document.getElementById('chartGeral');
  if (!ctx) return;

  const meses = getMeses();
  const datasets = [
    { pessoa: 'gabriel', label: 'Gabriel', color: '#1a6cf6' },
    { pessoa: 'gustavo', label: 'Gustavo', color: '#e0471d' },
    { pessoa: 'conjunto', label: 'Conjunto', color: '#0f9e6e' }
  ];

  const data = {
    labels: meses.map(m => mesLabel(m + '-01')),
    datasets: datasets.map(d => ({
      label: d.label,
      data: meses.map(m => {
        const lancs = STATE.lancamentos.filter(l => l.pessoa === d.pessoa && mesKey(l.data) === m);
        return lancs.reduce((acc, l) => l.tipo === 'entrada' ? acc + l.valor : acc - l.valor, 0);
      }),
      borderColor: d.color,
      backgroundColor: d.color + '22',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: d.color
    }))
  };

  if (chartGeralInst) chartGeralInst.destroy();
  chartGeralInst = new Chart(ctx, {
    type: 'line',
    data,
    options: chartOptions()
  });
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ' ' + fmtSigned(ctx.raw)
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { family: 'DM Sans', size: 11 },
          callback: v => 'R$ ' + v.toLocaleString('pt-BR')
        }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'DM Sans', size: 11 } }
      }
    }
  };
}

function getMeses() {
  if (STATE.lancamentos.length === 0) {
    const now = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      meses.push(d.toISOString().slice(0, 7));
    }
    return meses;
  }
  const keys = [...new Set(STATE.lancamentos.map(l => mesKey(l.data)))].sort();
  return keys;
}

// ── RENDER PESSOA ──────────────────────────────────────────
let chartGabrielInst = null;
let chartGustavoInst = null;
let chartConjuntoInst = null;

function renderPessoa(pessoa) {
  const pfx = pessoa === 'gabriel' ? 'g' : pessoa === 'gustavo' ? 'gu' : 'c';
  const entradas = calcEntradas(pessoa);
  const gastos   = calcGastos(pessoa);
  const saldo    = calcSaldo(pessoa);
  const boas     = calcBoas(pessoa);

  document.getElementById(pfx + '-entradas').textContent = fmt(entradas);
  document.getElementById(pfx + '-gastos').textContent   = fmt(gastos);

  const saldoEl = document.getElementById(pfx + '-saldo');
  saldoEl.textContent = fmt(saldo);
  saldoEl.className = 'metric-value ' + (saldo >= 0 ? 'green' : 'red');

  if (pfx !== 'c') {
    document.getElementById(pfx + '-boas').textContent = boas + (boas === 1 ? ' boa' : ' boas');
  }

  // extrato
  const extratoEl = document.getElementById('extrato' + pessoa.charAt(0).toUpperCase() + pessoa.slice(1));
  const lancs = STATE.lancamentos.filter(l => l.pessoa === pessoa).sort((a, b) => b.data.localeCompare(a.data));
  renderLancamentos(extratoEl, lancs);

  // chart
  const meses = getMeses();
  const color = pessoa === 'gabriel' ? '#1a6cf6' : pessoa === 'gustavo' ? '#e0471d' : '#0f9e6e';
  const canvasId = 'chart' + pessoa.charAt(0).toUpperCase() + pessoa.slice(1);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const chartData = {
    labels: meses.map(m => mesLabel(m + '-01')),
    datasets: [
      {
        label: 'Entradas',
        data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === pessoa && mesKey(l.data) === m && l.tipo === 'entrada').reduce((a, l) => a + l.valor, 0)),
        backgroundColor: color + '55',
        borderColor: color,
        borderWidth: 2
      },
      {
        label: 'Gastos',
        data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === pessoa && mesKey(l.data) === m && l.tipo === 'gasto').reduce((a, l) => a + l.valor, 0)),
        backgroundColor: '#e0471d33',
        borderColor: '#e0471d',
        borderWidth: 2
      }
    ]
  };

  const varName = 'chart' + pessoa.charAt(0).toUpperCase() + pessoa.slice(1) + 'Inst';
  if (window[varName]) window[varName].destroy();
  window[varName] = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { font: { family: 'DM Sans', size: 12 } } } },
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR'), font: { size: 11 } }
        },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── RENDER LANCAMENTOS ─────────────────────────────────────
function renderLancamentos(container, lancs) {
  if (!lancs.length) {
    container.innerHTML = '<p class="empty-state">Nenhum lançamento ainda.</p>';
    return;
  }

  const avatarMap = {
    gabriel:  { cls: 'avatar-gabriel',  initials: 'GB' },
    gustavo:  { cls: 'avatar-gustavo',  initials: 'GU' },
    conjunto: { cls: 'avatar-conjunto', initials: 'CJ' }
  };

  container.innerHTML = lancs.map(l => {
    const av = avatarMap[l.pessoa] || { cls: '', initials: '?' };
    const valClass = l.tipo === 'entrada' ? 'entrada' : 'gasto';
    const valSign  = l.tipo === 'entrada' ? '+' : '-';
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

  // Podium
  const sorted = [
    { nome: 'Gabriel', count: boasGabriel },
    { nome: 'Gustavo', count: boasGustavo }
  ].sort((a, b) => b.count - a.count);

  document.getElementById('rank1-nome').textContent  = sorted[0].nome;
  document.getElementById('rank1-count').textContent = sorted[0].count + (sorted[0].count === 1 ? ' boa' : ' boas');
  document.getElementById('rank2-nome').textContent  = sorted[1].nome;
  document.getElementById('rank2-count').textContent = sorted[1].count + (sorted[1].count === 1 ? ' boa' : ' boas');

  // Mensal
  const meses = getMeses();
  const mensalEl = document.getElementById('rankingMensal');

  if (!meses.length || (boasGabriel + boasGustavo === 0)) {
    mensalEl.innerHTML = '<p class="empty-state">Nenhuma "boa" registrada ainda. Vai lá pagar uma rodada! 🍻</p>';
  } else {
    mensalEl.innerHTML = meses.reverse().map(m => {
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
    }).filter(Boolean).join('') || '<p class="empty-state">Nenhuma boa nesse período.</p>';
  }

  // Histórico de boas
  const histEl = document.getElementById('rankingHistorico');
  const boas = STATE.lancamentos.filter(l => l.boa).sort((a, b) => b.data.localeCompare(a.data));
  renderLancamentos(histEl, boas);
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

// ── UTILS ──────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── INIT ───────────────────────────────────────────────────
loadState();
renderAll();