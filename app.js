/* ============================================================
   DUPLA FINANCEIRA — app.js
   Firebase Firestore + CRUD completo
   ============================================================ */

// ── FIREBASE CONFIG ────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyB_I-hV5qoik8evctBHSYJ6GZy3bAbtta8",
    authDomain: "financeiro-olhos-dourados.firebaseapp.com",
    projectId: "financeiro-olhos-dourados",
    storageBucket: "financeiro-olhos-dourados.firebasestorage.app",
    messagingSenderId: "982587536537",
    appId: "1:982587536537:web:2acdc3a1a76aa798c5f408"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const lancamentosRef = db.collection('lancamentos');

// ── STATE ──────────────────────────────────────────────────
const STATE = {
    lancamentos: [],
    metas: { gabriel: 3000, gustavo: 3000, conjunto: 5000 }
};

// ── SYNC BAR ───────────────────────────────────────────────
function setSyncStatus(status, msg) {
    const bar = document.getElementById('syncBar');
    const text = document.getElementById('syncMsg');
    bar.className = 'sync-bar ' + status;
    text.textContent = msg;
}

// ── HELPERS ────────────────────────────────────────────────
function fmt(val) {
    return 'R$ ' + Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtSigned(val) {
    return (val >= 0 ? '+ ' : '- ') + 'R$ ' + Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function mesLabel(dateStr) {
    if (!dateStr) return '—';
    const [y, m] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(m, 10) - 1] + '/' + y.slice(2);
}
function mesKey(dateStr) { return dateStr ? dateStr.slice(0, 7) : ''; }
function today() { return new Date().toISOString().slice(0, 10); }
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function showToast(msg, tipo) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (tipo === 'erro' ? ' toast--erro' : tipo === 'aviso' ? ' toast--aviso' : '');
    setTimeout(() => t.classList.remove('show'), 3000);
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
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    mobileOverlay.classList.toggle('open', open);
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
mobileNavBtns.forEach(btn => btn.addEventListener('click', () => { activateTab(btn.dataset.tab); closeMobileMenu(); }));

// ══════════════════════════════════════════════════════════
//   MODAL CRIAR (múltiplos lançamentos)
// ══════════════════════════════════════════════════════════
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

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancelar').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.getElementById('btnSalvar').addEventListener('click', async () => {
    const rows = document.querySelectorAll('.gasto-row');
    const novos = [];
    rows.forEach(row => {
        const id = row.id.replace('row-', '');
        const valor = parseFloat(document.getElementById('valor-' + id)?.value);
        const tipo = document.getElementById('tipo-' + id)?.value;
        const desc = document.getElementById('desc-' + id)?.value.trim();
        const pessoa = document.getElementById('pessoa-' + id)?.value;
        const data = document.getElementById('data-' + id)?.value;
        const boa = document.getElementById('boa-' + id)?.checked;
        if (!valor || valor <= 0 || !desc) return;
        novos.push({ valor, tipo, desc, pessoa, data: data || today(), boa, criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
    });

    if (!novos.length) { showToast('⚠️ Preencha pelo menos um lançamento válido', 'aviso'); return; }

    setSyncStatus('saving', 'Salvando…');
    const btn = document.getElementById('btnSalvar');
    btn.disabled = true; btn.textContent = 'Salvando…';

    try {
        const batch = db.batch();
        novos.forEach(l => batch.set(lancamentosRef.doc(), l));
        await batch.commit();
        closeModal();
        showToast('✅ ' + novos.length + ' lançamento' + (novos.length > 1 ? 's salvos' : ' salvo') + '!');
    } catch (err) {
        console.error(err);
        setSyncStatus('error', 'Erro ao salvar.');
        showToast('❌ Erro ao salvar. Tente novamente.', 'erro');
    } finally {
        btn.disabled = false; btn.textContent = 'Salvar tudo';
    }
});

// ══════════════════════════════════════════════════════════
//   MODAL EDITAR (lançamento único)
// ══════════════════════════════════════════════════════════
let editingId = null;

function abrirModalEditar(id) {
    const lanc = STATE.lancamentos.find(l => l.id === id);
    if (!lanc) return;
    editingId = id;

    document.getElementById('edit-valor').value = lanc.valor;
    document.getElementById('edit-tipo').value = lanc.tipo;
    document.getElementById('edit-desc').value = lanc.desc;
    document.getElementById('edit-pessoa').value = lanc.pessoa;
    document.getElementById('edit-data').value = lanc.data;
    document.getElementById('edit-boa').checked = lanc.boa || false;

    document.getElementById('modalEditOverlay').classList.add('open');
}

function closeModalEdit() {
    document.getElementById('modalEditOverlay').classList.remove('open');
    editingId = null;
}

document.getElementById('modalEditClose').addEventListener('click', closeModalEdit);
document.getElementById('btnEditCancelar').addEventListener('click', closeModalEdit);
document.getElementById('modalEditOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalEditOverlay')) closeModalEdit();
});

document.getElementById('btnEditSalvar').addEventListener('click', async () => {
    if (!editingId) return;

    const valor = parseFloat(document.getElementById('edit-valor').value);
    const tipo = document.getElementById('edit-tipo').value;
    const desc = document.getElementById('edit-desc').value.trim();
    const pessoa = document.getElementById('edit-pessoa').value;
    const data = document.getElementById('edit-data').value;
    const boa = document.getElementById('edit-boa').checked;

    if (!valor || valor <= 0 || !desc) { showToast('⚠️ Preencha todos os campos', 'aviso'); return; }

    setSyncStatus('saving', 'Atualizando…');
    const btn = document.getElementById('btnEditSalvar');
    btn.disabled = true; btn.textContent = 'Salvando…';

    try {
        await lancamentosRef.doc(editingId).update({ valor, tipo, desc, pessoa, data: data || today(), boa, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() });
        closeModalEdit();
        showToast('✏️ Lançamento atualizado!');
    } catch (err) {
        console.error(err);
        showToast('❌ Erro ao atualizar.', 'erro');
    } finally {
        btn.disabled = false; btn.textContent = 'Salvar alterações';
    }
});

// ══════════════════════════════════════════════════════════
//   MODAL CONFIRMAR EXCLUSÃO
// ══════════════════════════════════════════════════════════
let deletingId = null;

function abrirModalDeletar(id) {
    const lanc = STATE.lancamentos.find(l => l.id === id);
    if (!lanc) return;
    deletingId = id;
    document.getElementById('deleteDesc').textContent = lanc.desc;
    document.getElementById('deleteValor').textContent = fmt(lanc.valor);
    document.getElementById('modalDeleteOverlay').classList.add('open');
}

function closeModalDelete() {
    document.getElementById('modalDeleteOverlay').classList.remove('open');
    deletingId = null;
}

document.getElementById('modalDeleteClose').addEventListener('click', closeModalDelete);
document.getElementById('btnDeleteCancelar').addEventListener('click', closeModalDelete);
document.getElementById('modalDeleteOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalDeleteOverlay')) closeModalDelete();
});

document.getElementById('btnDeleteConfirmar').addEventListener('click', async () => {
    if (!deletingId) return;
    const btn = document.getElementById('btnDeleteConfirmar');
    btn.disabled = true; btn.textContent = 'Excluindo…';

    try {
        await lancamentosRef.doc(deletingId).delete();
        closeModalDelete();
        showToast('🗑️ Lançamento excluído.');
    } catch (err) {
        console.error(err);
        showToast('❌ Erro ao excluir.', 'erro');
    } finally {
        btn.disabled = false; btn.textContent = 'Sim, excluir';
    }
});

// ── LISTENER EM TEMPO REAL ─────────────────────────────────
function iniciarListener() {
    setSyncStatus('', 'Conectando ao banco de dados…');
    listenerUnsubscribe = lancamentosRef.orderBy('criadoEm', 'asc').onSnapshot(
        snapshot => {
            STATE.lancamentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), data: doc.data().data || today() }));
            setSyncStatus('synced', 'Sincronizado · ' + STATE.lancamentos.length + ' lançamento' + (STATE.lancamentos.length !== 1 ? 's' : ''));
            renderAll();
        },
        err => {
            console.error(err);
            setSyncStatus('error', 'Sem conexão. Dados podem estar desatualizados.');
        }
    );
}

// ── CÁLCULOS ───────────────────────────────────────────────
function calcSaldo(p) { return STATE.lancamentos.filter(l => l.pessoa === p).reduce((a, l) => l.tipo === 'entrada' ? a + l.valor : a - l.valor, 0); }
function calcEntradas(p) { return STATE.lancamentos.filter(l => l.pessoa === p && l.tipo === 'entrada').reduce((a, l) => a + l.valor, 0); }
function calcGastos(p) { return STATE.lancamentos.filter(l => l.pessoa === p && l.tipo === 'gasto').reduce((a, l) => a + l.valor, 0); }
function calcBoas(p) { return STATE.lancamentos.filter(l => l.boa && l.pessoa === p).length; }
function getMeses() {
    if (!STATE.lancamentos.length) {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1); return d.toISOString().slice(0, 7); });
    }
    return [...new Set(STATE.lancamentos.map(l => mesKey(l.data)))].sort();
}

// ── CHARTS ────────────────────────────────────────────────
const _charts = {};
function destroyChart(id) { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } }
function saveChart(id, inst) { _charts[id] = inst; }

// ── RENDER HOME ────────────────────────────────────────────
function renderHome() {
    ['gabriel', 'gustavo', 'conjunto'].forEach(p => {
        const saldo = calcSaldo(p), meta = STATE.metas[p] || 3000, key = capitalize(p);
        document.getElementById('saldo' + key).textContent = fmt(saldo);
        const sEl = document.getElementById('status' + key);
        if (saldo > 0) { sEl.textContent = '↑ Positivo'; sEl.className = 'dash-card-status status-positivo'; }
        else if (saldo < 0) { sEl.textContent = '↓ Negativo'; sEl.className = 'dash-card-status status-negativo'; }
        else { sEl.textContent = 'Zerado'; sEl.className = 'dash-card-status status-neutro'; }
        const pct = Math.min(100, Math.max(0, Math.round((calcEntradas(p) / meta) * 100)));
        document.getElementById('meta' + key).textContent = 'Meta: ' + pct + '% atingida';
    });
    renderLancamentos(document.getElementById('listaRecente'),
        [...STATE.lancamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10));
    renderChartGeral();
    renderChartPizza();
}

function renderChartGeral() {
    const ctx = document.getElementById('chartGeral'); if (!ctx) return;
    destroyChart('geral');
    const meses = getMeses();
    const defs = [{ pessoa: 'gabriel', label: 'Gabriel', color: '#1a6cf6' }, { pessoa: 'gustavo', label: 'Gustavo', color: '#e0471d' }, { pessoa: 'conjunto', label: 'Conjunto', color: '#0f9e6e' }];
    saveChart('geral', new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses.map(m => mesLabel(m + '-01')),
            datasets: defs.map(d => ({
                label: d.label,
                data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === d.pessoa && mesKey(l.data) === m).reduce((a, l) => l.tipo === 'entrada' ? a + l.valor : a - l.valor, 0)),
                borderColor: d.color, backgroundColor: d.color + '20', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: d.color
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

function renderChartPizza() {
    const ctx = document.getElementById('chartPizza'), leg = document.getElementById('pizzaLegend');
    if (!ctx || !leg) return;
    destroyChart('pizza');
    const gG = calcGastos('gabriel'), gU = calcGastos('gustavo'), gC = calcGastos('conjunto'), total = gG + gU + gC;
    if (!total) { leg.innerHTML = '<p class="pizza-empty">Nenhum gasto registrado ainda.</p>'; ctx.style.display = 'none'; return; }
    ctx.style.display = '';
    const labels = ['Gabriel', 'Gustavo', 'Conjunto'], dados = [gG, gU, gC], cores = ['#1a6cf6', '#e0471d', '#0f9e6e'];
    saveChart('pizza', new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: dados, backgroundColor: cores.map(c => c + 'cc'), borderColor: cores, borderWidth: 2, hoverOffset: 8 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '62%',
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.raw) + ' (' + ((ctx.raw / total) * 100).toFixed(1) + '%)' } } }
        }
    }));
    leg.innerHTML = labels.map((l, i) => { if (!dados[i]) return ''; const pct = ((dados[i] / total) * 100).toFixed(1); return `<div class="pizza-legend-item"><div class="pizza-legend-left"><span class="pizza-dot" style="background:${cores[i]}"></span><span>${l}</span></div><span class="pizza-legend-val">${fmt(dados[i])} <span style="color:var(--clr-muted);font-weight:400">(${pct}%)</span></span></div>`; }).filter(Boolean).join('');
}

// ── RENDER PESSOA ──────────────────────────────────────────
function renderPessoa(pessoa) {
    const pfx = pessoa === 'gabriel' ? 'g' : pessoa === 'gustavo' ? 'gu' : 'c';
    const entradas = calcEntradas(pessoa), gastos = calcGastos(pessoa), saldo = calcSaldo(pessoa), boas = calcBoas(pessoa);
    document.getElementById(pfx + '-entradas').textContent = fmt(entradas);
    document.getElementById(pfx + '-gastos').textContent = fmt(gastos);
    const sEl = document.getElementById(pfx + '-saldo');
    sEl.textContent = fmt(saldo); sEl.className = 'metric-value ' + (saldo >= 0 ? 'green' : 'red');
    if (pfx !== 'c') document.getElementById(pfx + '-boas').textContent = boas + (boas === 1 ? ' boa' : ' boas');

    renderLancamentos(document.getElementById('extrato' + capitalize(pessoa)),
        STATE.lancamentos.filter(l => l.pessoa === pessoa).sort((a, b) => b.data.localeCompare(a.data)));

    const meses = getMeses(), color = pessoa === 'gabriel' ? '#1a6cf6' : pessoa === 'gustavo' ? '#e0471d' : '#0f9e6e';
    const canvasId = 'chart' + capitalize(pessoa), ctx = document.getElementById(canvasId);
    if (!ctx) return;
    destroyChart(canvasId);
    saveChart(canvasId, new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses.map(m => mesLabel(m + '-01')),
            datasets: [
                { label: 'Entradas', data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === pessoa && mesKey(l.data) === m && l.tipo === 'entrada').reduce((a, l) => a + l.valor, 0)), backgroundColor: color + '55', borderColor: color, borderWidth: 2 },
                { label: 'Gastos', data: meses.map(m => STATE.lancamentos.filter(l => l.pessoa === pessoa && mesKey(l.data) === m && l.tipo === 'gasto').reduce((a, l) => a + l.valor, 0)), backgroundColor: '#e0471d33', borderColor: '#e0471d', borderWidth: 2 }
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

// ── RENDER LANÇAMENTOS (com botões editar/deletar) ─────────
function renderLancamentos(container, lancs) {
    if (!container) return;
    if (!lancs.length) { container.innerHTML = '<p class="empty-state">Nenhum lançamento ainda.</p>'; return; }
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
        return `<div class="lancamento-item">
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
        <div class="lanc-actions">
          <button class="btn-action btn-action--edit" onclick="abrirModalEditar('${l.id}')" title="Editar">✏️</button>
          <button class="btn-action btn-action--delete" onclick="abrirModalDeletar('${l.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
    </div>`;
    }).join('');
}

// ── RENDER RANKING ─────────────────────────────────────────
function renderRanking() {
    const bG = calcBoas('gabriel'), bU = calcBoas('gustavo');
    const sorted = [{ nome: 'Gabriel', count: bG }, { nome: 'Gustavo', count: bU }].sort((a, b) => b.count - a.count);
    document.getElementById('rank1-nome').textContent = sorted[0].nome;
    document.getElementById('rank1-count').textContent = sorted[0].count + (sorted[0].count === 1 ? ' boa' : ' boas');
    document.getElementById('rank2-nome').textContent = sorted[1].nome;
    document.getElementById('rank2-count').textContent = sorted[1].count + (sorted[1].count === 1 ? ' boa' : ' boas');

    const meses = getMeses(), mensalEl = document.getElementById('rankingMensal');
    if (!meses.length || (bG + bU === 0)) { mensalEl.innerHTML = '<p class="empty-state">Nenhuma "boa" registrada ainda. Vai lá pagar uma rodada! 🍻</p>'; }
    else {
        const rows = [...meses].reverse().map(m => {
            const gab = STATE.lancamentos.filter(l => l.boa && l.pessoa === 'gabriel' && mesKey(l.data) === m).length;
            const gus = STATE.lancamentos.filter(l => l.boa && l.pessoa === 'gustavo' && mesKey(l.data) === m).length;
            if (!gab && !gus) return '';
            const winner = gab > gus ? 'Gabriel' : gus > gab ? 'Gustavo' : 'Empate';
            return `<div class="mes-card"><span class="mes-label">${mesLabel(m + '-01')}</span><div class="mes-bar-wrap"><span class="mes-bar-item"><span class="mes-dot mes-dot-gabriel"></span>Gabriel: ${gab}</span><span class="mes-bar-item"><span class="mes-dot mes-dot-gustavo"></span>Gustavo: ${gus}</span></div><span class="mes-winner-badge">${winner === 'Empate' ? '🤝 Empate' : '🏆 ' + winner}</span></div>`;
        }).filter(Boolean).join('');
        mensalEl.innerHTML = rows || '<p class="empty-state">Nenhuma boa nesse período.</p>';
    }
    renderLancamentos(document.getElementById('rankingHistorico'),
        STATE.lancamentos.filter(l => l.boa).sort((a, b) => b.data.localeCompare(a.data)));
}

// ── RENDER ALL ─────────────────────────────────────────────
function renderAll() {
    const active = document.querySelector('.page.active'); if (!active) return;
    const id = active.id;
    if (id === 'page-home') renderHome();
    if (id === 'page-gabriel') renderPessoa('gabriel');
    if (id === 'page-gustavo') renderPessoa('gustavo');
    if (id === 'page-conjuntos') renderPessoa('conjunto');
    if (id === 'page-ranking') renderRanking();
}

// ── AUTENTICAÇÃO ───────────────────────────────────────────
const NOMES = {
    'gabriel@duplafinanceira.com': 'Gabriel',
    'gustavo@duplafinanceira.com': 'Gustavo'
};

let listenerUnsubscribe = null; // guarda referência para cancelar o listener ao fazer logout

// Controla qual tela mostrar
auth.onAuthStateChanged(user => {
    if (user) {
        // Logado — mostra o app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appWrapper').style.display = 'block';

        const nome = NOMES[user.email] || user.email;
        document.getElementById('navUserName').textContent = '👋 ' + nome;
        document.getElementById('mobileUserName').textContent = '👋 ' + nome;

        // Inicia listener do Firestore só após login
        if (!listenerUnsubscribe) iniciarListener();
    } else {
        // Deslogado — mostra tela de login e cancela listener
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appWrapper').style.display = 'none';
        if (listenerUnsubscribe) { listenerUnsubscribe(); listenerUnsubscribe = null; }
        STATE.lancamentos = [];
    }
});

// ── TELA DE LOGIN ──────────────────────────────────────────
const loginEmailEl = document.getElementById('loginEmail');
const loginSenhaEl = document.getElementById('loginSenha');
const loginErrorEl = document.getElementById('loginError');

document.getElementById('btnShowPass').addEventListener('click', () => {
    const input = loginSenhaEl;
    input.type = input.type === 'password' ? 'text' : 'password';
});

// Login ao pressionar Enter em qualquer campo
[loginEmailEl, loginSenhaEl].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') fazerLogin(); });
});

document.getElementById('btnLogin').addEventListener('click', fazerLogin);

async function fazerLogin() {
    const email = loginEmailEl.value.trim();
    const senha = loginSenhaEl.value;
    loginErrorEl.textContent = '';

    if (!email || !senha) { loginErrorEl.textContent = 'Preencha e-mail e senha.'; return; }

    const btn = document.getElementById('btnLogin');
    btn.disabled = true; btn.textContent = 'Entrando…';

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        // onAuthStateChanged cuida do resto
    } catch (err) {
        const msgs = {
            'auth/user-not-found': 'E-mail não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
        };
        loginErrorEl.textContent = msgs[err.code] || 'Erro ao entrar. Tente novamente.';
    } finally {
        btn.disabled = false; btn.textContent = 'Entrar';
    }
}

// ── LOGOUT ─────────────────────────────────────────────────
async function fazerLogout() {
    await auth.signOut();
    loginEmailEl.value = '';
    loginSenhaEl.value = '';
}

document.getElementById('btnLogout').addEventListener('click', fazerLogout);
document.getElementById('btnLogoutMobile').addEventListener('click', () => { fazerLogout(); closeMobileMenu(); });

// ── INIT ───────────────────────────────────────────────────
// (auth.onAuthStateChanged já cuida de iniciar o listener quando logado)