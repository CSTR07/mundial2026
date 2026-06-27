/* Predicciones Mundial 2026 — render del lado del cliente (grupos + eliminatorias) */

const FLAGS = {
  "Argentina":"🇦🇷","Brazil":"🇧🇷","Uruguay":"🇺🇾","Colombia":"🇨🇴","Paraguay":"🇵🇾",
  "Ecuador":"🇪🇨","France":"🇫🇷","Spain":"🇪🇸","Germany":"🇩🇪","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Netherlands":"🇳🇱","Belgium":"🇧🇪","Portugal":"🇵🇹","Austria":"🇦🇹","Switzerland":"🇨🇭",
  "Sweden":"🇸🇪","Norway":"🇳🇴","Croatia":"🇭🇷","Czech Republic":"🇨🇿","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Turkey":"🇹🇷","Egypt":"🇪🇬","Morocco":"🇲🇦","Senegal":"🇸🇳","Algeria":"🇩🇿",
  "Ghana":"🇬🇭","Ivory Coast":"🇨🇮","Tunisia":"🇹🇳","South Africa":"🇿🇦","Cape Verde":"🇨🇻",
  "Japan":"🇯🇵","South Korea":"🇰🇷","Iran":"🇮🇷","Qatar":"🇶🇦","Saudi Arabia":"🇸🇦",
  "Australia":"🇦🇺","Iraq":"🇮🇶","Uzbekistan":"🇺🇿","Jordan":"🇯🇴","Mexico":"🇲🇽",
  "United States":"🇺🇸","Canada":"🇨🇦","Panama":"🇵🇦","Haiti":"🇭🇹","Curaçao":"🇨🇼",
  "New Zealand":"🇳🇿","Bosnia and Herzegovina":"🇧🇦","DR Congo":"🇨🇩"
};
const flag = t => FLAGS[t] || "🏟️";
const pct = x => Math.round(x * 100);

const DATA = window.PREDICTIONS;
let activeStage = "all";
let activeDate = "all";
let activeStatus = "all";

const STAGE_ORDER = ["group", "r32", "r16", "qf", "sf", "third", "final"];
const STAGE_LABELS = { group:"Grupos", r32:"16vos", r16:"8vos", qf:"4tos", sf:"Semis", third:"3er lugar", final:"Final" };

function init() {
  if (!DATA || !DATA.matches) {
    document.getElementById("match-grid").innerHTML =
      '<p style="padding:20px">No se encontraron datos. Ejecuta <code>python update.py</code>.</p>';
    return;
  }
  document.getElementById("meta-line").textContent =
    `${DATA.meta.n_played}/${DATA.meta.n_matches} jugados · ${DATA.meta.model}`;
  setFooterDate();
  buildPerformancePanel();
  buildSimPanel();
  buildHistoryPanel();
  buildRecentResults();
  buildQuiniela();
  buildValuePanel();
  buildParlay();
  buildStageFilters();
  buildDateFilters();
  buildStatusFilters();
  initTabs();
  render();
}

/* ===================== Navegación por pestañas ===================== */
function initTabs() {
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach(b => b.addEventListener("click", () => {
    btns.forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    b.classList.add("active");
    const panel = document.getElementById("tab-" + b.dataset.tab);
    if (panel) panel.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}

/* Identificador estable de partido (para guardar la quiniela) */
const matchId = m => `${m.date}|${m.home}|${m.away}`;

/* Pronóstico del modelo para un partido: "home" | "draw" | "away" */
function modelPick(m) {
  const p = m.p1x2;
  return p.home >= p.draw && p.home >= p.away ? "home" : (p.away >= p.draw ? "away" : "draw");
}
/* Resultado real: "home" | "draw" | "away" | null */
function realResult(m) {
  if (m.status !== "jugado" || !m.real_score) return null;
  const [gh, ga] = m.real_score.split("-").map(Number);
  if ([gh, ga].some(isNaN)) return null;
  return gh > ga ? "home" : (gh < ga ? "away" : "draw");
}

function setFooterDate() {
  const el = document.getElementById("data-timestamp");
  if (!el || !DATA.meta || !DATA.meta.generated_at) return;
  const raw = DATA.meta.generated_at;
  // Compatible con formato viejo (solo fecha) y nuevo (fecha+hora ISO)
  const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00Z");
  if (isNaN(d)) { el.textContent = "Datos actualizados: " + raw; return; }
  const hasTime = raw.includes("T");
  const opts = hasTime
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }
    : { year: "numeric", month: "long", day: "numeric" };
  el.textContent = "Datos actualizados: " + d.toLocaleString("es-MX", opts) + (hasTime ? " (CDMX)" : "");
}

function reliabilitySVG(rel) {
  if (!rel || !rel.length) return "";
  const W = 260, H = 260, pad = 34;
  const sx = p => pad + p * (W - 2 * pad);
  const sy = p => (H - pad) - p * (H - 2 * pad);
  let g = `<svg viewBox="0 0 ${W} ${H}" class="reliability" role="img" aria-label="Diagrama de fiabilidad">`;
  g += `<rect x="${pad}" y="${pad}" width="${W - 2 * pad}" height="${H - 2 * pad}" fill="none" stroke="#262B36"/>`;
  g += `<line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(1)}" y2="${sy(1)}" stroke="#5B6373" stroke-dasharray="4 4"/>`;
  // ruta del modelo
  const pts = rel.map(r => `${sx(r.pred)},${sy(r.obs)}`).join(" ");
  g += `<polyline points="${pts}" fill="none" stroke="#C9F73E" stroke-width="2"/>`;
  rel.forEach(r => {
    const rad = Math.max(2.5, Math.min(7, Math.sqrt(r.n)));
    g += `<circle cx="${sx(r.pred)}" cy="${sy(r.obs)}" r="${rad}" fill="#C9F73E" fill-opacity="0.85"/>`;
  });
  g += `<text x="${W / 2}" y="${H - 6}" fill="#8A93A6" font-size="10" text-anchor="middle">Probabilidad predicha</text>`;
  g += `<text x="12" y="${H / 2}" fill="#8A93A6" font-size="10" text-anchor="middle" transform="rotate(-90 12 ${H / 2})">Frecuencia observada</text>`;
  g += `</svg>`;
  return g;
}

function buildSimPanel() {
  const host = document.getElementById("sim-panel");
  if (!host) return;
  const sim = DATA.meta.simulation;
  if (!sim || !sim.teams || !Object.keys(sim.teams).length) { host.innerHTML = ""; return; }
  const entries = Object.entries(sim.teams);
  const maxCh = Math.max(...entries.map(([, p]) => p.champion), 0.01);
  const row = ([t, p], i) => {
    const w = Math.max(2, (p.champion / maxCh) * 100);
    return `<tr>
      <td class="rk">${i + 1}</td>
      <td class="tm">${flag(t)} ${t}</td>
      <td class="num">${pct(p.r32)}%</td>
      <td class="num">${pct(p.qf)}%</td>
      <td class="num">${pct(p.sf)}%</td>
      <td class="num">${pct(p.final)}%</td>
      <td class="champ"><span class="champ-bar" style="width:${w}%"></span><span class="champ-val">${(p.champion * 100).toFixed(1)}%</span></td>
    </tr>`;
  };
  const top = entries.slice(0, 16).map(row).join("");
  const rest = entries.slice(16).map(row).join("");
  host.innerHTML = `
    <button class="perf-toggle" id="sim-toggle">🏆 Probabilidades del torneo · simulación Monte Carlo ▾</button>
    <div class="perf-body" id="sim-body">
      <p class="perf-intro">Resultado de simular el torneo completo <b>${sim.n_sims.toLocaleString("es-MX")} veces</b>
      (método Monte Carlo). Cada simulación juega los partidos que faltan según el modelo, arma el bracket con
      las reglas FIFA 2026 (mejores 8 terceros incluidos) y llega hasta la final. Es lo que usan los simuladores de pago.</p>
      <div class="sim-table-wrap">
        <table class="sim-table">
          <thead><tr><th>#</th><th>Selección</th><th>16vos</th><th>4tos</th><th>Semis</th><th>Final</th><th>Campeón</th></tr></thead>
          <tbody>${top}</tbody>
          ${rest ? `<tbody id="sim-rest" class="hidden">${rest}</tbody>` : ""}
        </table>
      </div>
      ${rest ? `<button class="sim-more" id="sim-more">Ver las ${entries.length} selecciones ▾</button>` : ""}
    </div>`;
  const body = document.getElementById("sim-body");
  body.classList.add("open");
  document.getElementById("sim-toggle").textContent = "🏆 Probabilidades del torneo · simulación Monte Carlo ▴";
  document.getElementById("sim-toggle").onclick = (ev) => {
    const open = body.classList.toggle("open");
    ev.target.textContent = "🏆 Probabilidades del torneo · simulación Monte Carlo " + (open ? "▴" : "▾");
  };
  const moreBtn = document.getElementById("sim-more");
  if (moreBtn) moreBtn.onclick = () => {
    const r = document.getElementById("sim-rest");
    const shown = r.classList.toggle("hidden");
    moreBtn.textContent = shown ? `Ver las ${entries.length} selecciones ▾` : "Ver menos ▴";
  };
}

function buildPerformancePanel() {
  const host = document.getElementById("perf-panel");
  if (!host) return;
  const e = DATA.meta.evaluation, c = DATA.meta.calibration;
  if (!e || !e.n) { host.innerHTML = ""; return; }
  const tile = (v, l) => `<div class="perf-tile"><div class="pv">${v}</div><div class="pl">${l}</div></div>`;
  const skillTxt = (e.skill_score > 0 ? "+" : "") + Math.round(e.skill_score * 100) + "%";
  host.innerHTML = `
    <button class="perf-toggle" id="perf-toggle">📊 Rendimiento y calibración del modelo ▾</button>
    <div class="perf-body" id="perf-body">
      <p class="perf-intro">Medido sobre los <b>${e.n} partidos ya jugados</b>, comparando la predicción
      previa del modelo contra el resultado real. Así es como los modelos profesionales se auditan.</p>
      <div class="perf-grid">
        ${tile(Math.round(e.accuracy_1x2 * 100) + "%", "Precisión 1X2")}
        ${tile(e.logloss_1x2, "Log loss")}
        ${tile(e.brier_1x2, "Brier 1X2")}
        ${tile(e.ece_1x2, "Error de calibración")}
        ${tile(skillTxt, "Skill vs. baseline")}
      </div>
      <div class="perf-cols">
        <div class="perf-chart">
          ${reliabilitySVG(e.reliability)}
          <p class="perf-cap">Cuanto más cerca de la diagonal, mejor calibrado: una predicción del 70% acierta ~70% de las veces.</p>
        </div>
        <div class="perf-notes">
          <p><b>Cómo leer esto</b></p>
          <ul>
            <li><b>Log loss ${e.logloss_1x2}</b> vs ${e.logloss_baseline} de un baseline (tasa base). Menor es mejor.</li>
            <li><b>Skill ${skillTxt}</b>: cuánto supera el modelo a no tener modelo. Positivo = aporta información.</li>
            <li><b>Brier</b> y <b>ECE</b> miden qué tan fiables son las probabilidades (menor es mejor).</li>
            <li>Otros mercados — Over 2.5: Brier ${e.brier_over25} · Ambos anotan: Brier ${e.brier_btts}.</li>
          </ul>
          <p class="perf-method">Calibración: temperatura T=${c.temperature} · recencia con vida media ${c.half_life_days} días ·
          ${c.n_samples} partidos en el ajuste.</p>
        </div>
      </div>
    </div>`;
  const body = document.getElementById("perf-body");
  body.classList.add("open");
  document.getElementById("perf-toggle").textContent = "📊 Rendimiento y calibración del modelo ▴";
  document.getElementById("perf-toggle").onclick = (ev) => {
    const open = body.classList.toggle("open");
    ev.target.textContent = "📊 Rendimiento y calibración del modelo " + (open ? "▴" : "▾");
  };
}

function pill(nav, val, label, active, onclick) {
  const b = document.createElement("button");
  b.className = "filter-btn" + (val === active ? " active" : "");
  b.textContent = label; b.onclick = onclick; nav.appendChild(b);
}

function buildStageFilters() {
  const nav = document.getElementById("stage-filters");
  const present = STAGE_ORDER.filter(s => DATA.matches.some(m => m.stage_key === s));
  nav.innerHTML = "";
  pill(nav, "all", "Todas las fases", activeStage, () => { activeStage = "all"; refresh(); });
  present.forEach(s => pill(nav, s, STAGE_LABELS[s] || s, activeStage,
    () => { activeStage = s; refresh(); }));
}

function buildDateFilters() {
  let list = DATA.matches;
  if (activeStage !== "all") list = list.filter(m => m.stage_key === activeStage);
  const dates = [...new Set(list.map(m => m.date))].filter(Boolean).sort();
  const nav = document.getElementById("date-filters");
  nav.innerHTML = "";
  pill(nav, "all", "Todas las fechas", activeDate, () => { activeDate = "all"; render(); buildStatusFilters(); });
  dates.forEach(d => { const [, mo, da] = d.split("-");
    pill(nav, d, `${da}/${mo}`, activeDate, () => { activeDate = d; render(); }); });
}

function buildStatusFilters() {
  const nav = document.getElementById("status-filters");
  nav.innerHTML = "";
  [["all","Todos"],["pendiente","Por jugar"],["jugado","Jugados"],["proximo","Próximos"]]
    .forEach(([v, l]) => pill(nav, v, l, activeStatus, () => { activeStatus = v; render(); }));
}

function refresh() { buildStageFilters(); activeDate = "all"; buildDateFilters(); render(); }

function render() {
  const grid = document.getElementById("match-grid");
  let list = DATA.matches.slice();
  if (activeStage !== "all") list = list.filter(m => m.stage_key === activeStage);
  if (activeDate !== "all") list = list.filter(m => m.date === activeDate);
  if (activeStatus !== "all") list = list.filter(m => m.status === activeStatus);
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = '<p style="padding:20px;color:#8A93A6">No hay partidos para este filtro.</p>';
    return;
  }
  list.forEach((m, i) => grid.appendChild(card(m, i)));
}

function aciertos(m) {
  if (m.status !== "jugado" || !m.real_score || !m.p1x2) return [];
  const parts = m.real_score.split("-").map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return [];
  const [gh, ga] = parts; const out = [];
  const realRes = gh > ga ? "home" : (gh < ga ? "away" : "draw");
  const p = m.p1x2;
  const pick = p.home >= p.draw && p.home >= p.away ? "home" : (p.away >= p.draw ? "away" : "draw");
  if (pick === realRes)
    out.push("1X2 · " + (realRes === "home" ? "Ganó " + m.home : realRes === "away" ? "Ganó " + m.away : "Empate"));
  if (m.scorelines && m.scorelines.some(s => s.score === m.real_score)) out.push("Marcador exacto " + m.real_score);
  const modelOver = m.over_under["over_2.5"] > 0.5;
  if ((gh + ga > 2.5) === modelOver) out.push(modelOver ? "Over 2.5" : "Under 2.5");
  const modelBtts = m.btts.yes > 0.5;
  if ((gh > 0 && ga > 0) === modelBtts) out.push(modelBtts ? "Ambos anotan" : "No ambos anotan");
  return out;
}

function card(m, idx) {
  const el = document.createElement("article");
  el.className = "match-card";
  const [, mo, da] = (m.date || "--").split("-");
  const stageBadge = m.stage_key === "group"
    ? `<b>${(m.group || "").trim()}</b>` : `<b class="ko">${m.stage}</b>`;

  // Partido de eliminatoria con equipos aún por definir
  if (m.status === "proximo") {
    el.classList.add("upcoming");
    el.innerHTML = `
      <div class="card-top">
        <span class="grp">${da}/${mo} ${stageBadge}</span>
        <span class="top-right"><span class="status-pill status-proximo">Próximo</span></span>
      </div>
      <div class="teams upcoming-teams">
        <div class="team"><span class="flag">🏟️</span><span class="name">${m.home}</span></div>
        <span class="vs">VS</span>
        <div class="team"><span class="flag">🏟️</span><span class="name">${m.away}</span></div>
      </div>
      <p class="upcoming-note">Equipos por definir · se predice automáticamente al confirmarse</p>`;
    return el;
  }

  const ph = pct(m.p1x2.home), pd = pct(m.p1x2.draw), pa = pct(m.p1x2.away);
  const seg = (cls, v) => `<div class="prob-seg ${cls}" style="flex:${v}">${v >= 8 ? v + "%" : ""}</div>`;
  const played = m.status === "jugado";
  const statusClass = played ? "status-jugado" : "status-pendiente";
  const statusText = played ? `Final ${m.real_score}` : "Por jugar";

  let aciertosHTML = "";
  if (played) {
    const hits = aciertos(m);
    if (hits.length)
      aciertosHTML = `<div class="aciertos"><span class="lab">Acertó:</span>` +
        hits.map(h => `<span class="acierto-chip">${h}</span>`).join("") + `</div>`;
  }

  el.innerHTML = `
    <div class="card-top">
      <span class="grp">${da}/${mo} ${stageBadge}</span>
      <span class="top-right"><span class="status-pill ${statusClass}">${statusText}</span></span>
    </div>
    <div class="teams">
      <div class="team"><span class="flag">${flag(m.home)}</span><span class="name">${m.home}</span></div>
      <span class="vs">${played ? `<span class="real-score">${m.real_score}</span>` : "VS"}</span>
      <div class="team"><span class="flag">${flag(m.away)}</span><span class="name">${m.away}</span></div>
    </div>
    <div class="prob-wrap">
      <div class="prob-bar">${seg("home", ph)}${seg("draw", pd)}${seg("away", pa)}</div>
      <div class="prob-labels">
        <span>${ph}% ${m.home}</span><span>Empate ${pd}%</span><span>${m.away} ${pa}%</span>
      </div>
    </div>
    ${aciertosHTML}
    <div class="stats">
      <div class="stat"><div class="val">${m.xg.total.toFixed(1)}</div><div class="lab">Goles esp.</div></div>
      <div class="stat"><div class="val">${pct(m.over_under["over_2.5"])}%</div><div class="lab">Over 2.5</div></div>
      <div class="stat"><div class="val">${m.corners.expected_total.toFixed(1)}</div><div class="lab">Córners</div></div>
      <div class="stat"><div class="val">${m.cards.expected_total.toFixed(1)}</div><div class="lab">Tarjetas</div></div>
    </div>
    <div class="detail" id="detail-${idx}">${detailHTML(m)}</div>
    <button class="expand-btn" data-idx="${idx}">Ver detalle ▾</button>`;

  el.querySelector(".expand-btn").onclick = (e) => {
    const d = el.querySelector(`#detail-${idx}`);
    e.target.textContent = d.classList.toggle("open") ? "Ocultar detalle ▴" : "Ver detalle ▾";
  };
  return el;
}

function detailHTML(m) {
  const played = m.status === "jugado";
  const scorelines = m.scorelines.map(s => {
    const hit = played && s.score === m.real_score;
    return `<span class="tag${hit ? " hit" : ""}">${s.score} · ${pct(s.p)}%</span>`;
  }).join(" ");

  const scorerCol = (team) => {
    const rows = (m.scorers[team] || []).map(([name, p]) => `
      <div class="scorer-row">
        <span><span class="mini-bar" style="width:${Math.max(6, pct(p) * 1.1)}px"></span>${name}</span>
        <span class="pct">${pct(p)}%</span></div>`).join("");
    return `<div class="scorer-col"><div class="col-team">${flag(team)} ${team}</div>${rows}</div>`;
  };

  const factorBox = (team) => {
    const f = m.form[team];
    return `<div><div class="col-team">${flag(team)} ${team}</div>
      <div class="factor-row"><span>Confederación</span><span class="tag">${f.conf} ${f.conf_factor}×</span></div>
      <div class="factor-row"><span>Forma reciente</span><span class="tag">${f.form_label} ${f.form}×</span></div>
      <div class="factor-row"><span>Estilo</span><span class="tag">${f.style_label} ${f.style}×</span></div></div>`;
  };

  let oddsHTML = "";
  if (m.odds) {
    const labelMap = { local: m.home, empate: "Empate", visitante: m.away };
    const rows = m.odds.mercados.map(mk => {
      const edge = mk.ventaja_modelo * 100;
      const last = mk.apuesta_de_valor ? '<span class="value-flag">VALOR</span>'
        : `<span class="${edge > 0 ? "edge-pos" : "edge-neg"}">${edge > 0 ? "+" : ""}${edge.toFixed(0)}%</span>`;
      return `<tr class="${mk.apuesta_de_valor ? "value-row" : ""}">
        <td>${labelMap[mk.resultado]}</td><td class="num">${pct(mk.prob_modelo)}%</td>
        <td class="num">${pct(mk.prob_mercado)}%</td><td class="num">${mk.momio.toFixed(2)}</td><td>${last}</td></tr>`;
    }).join("");
    oddsHTML = `<div class="detail-section">
      <h4>Modelo vs. mercado de referencia · margen ${pct(m.odds.margen_casa)}%</h4>
      <table class="odds-table"><thead><tr><th>Resultado</th><th>Modelo</th><th>Mercado</th><th>Momio</th><th>Ventaja</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  return `
    <div class="detail-section"><h4>Marcadores más probables</h4><div>${scorelines}</div></div>
    <div class="detail-section"><h4>Anotadores probables</h4>
      <div class="scorer-team">${scorerCol(m.home)}${scorerCol(m.away)}</div></div>
    <div class="detail-section"><h4>Factores actuales (base de la predicción)</h4>
      <div class="factor-grid">${factorBox(m.home)}${factorBox(m.away)}</div></div>
    ${oddsHTML}
    <div class="detail-section"><h4>Mercados de goles</h4>
      <div class="factor-row"><span>Ambos anotan (BTTS)</span><span class="tag">${pct(m.btts.yes)}%</span></div>
      <div class="factor-row"><span>Over 1.5 / 2.5 / 3.5</span><span class="tag">${pct(m.over_under["over_1.5"])}% · ${pct(m.over_under["over_2.5"])}% · ${pct(m.over_under["over_3.5"])}%</span></div>
      <div class="factor-row"><span>Córners (Over 9.5)</span><span class="tag">${pct(m.corners.over_under["over_9.5"])}%</span></div>
      <div class="factor-row"><span>Tarjetas (Over 4.5)</span><span class="tag">${pct(m.cards.over_under["over_4.5"])}%</span></div>
    </div>`;
}

/* ===================== Historial: evolución de la precisión ===================== */
function buildHistoryPanel() {
  const host = document.getElementById("history-panel");
  if (!host) return;
  const h = (DATA.meta && DATA.meta.history) || [];
  const pts = h.filter(d => typeof d.accuracy === "number");
  if (pts.length < 2) {
    host.innerHTML = `<div class="hist-card"><h3>Evolución de la precisión</h3>
      <p class="hist-note">El historial se construye automáticamente: cada día queda registrada la precisión
      del modelo sobre los partidos ya jugados. En cuanto haya más días de datos, aparecerá aquí la gráfica
      de evolución. (Puntos registrados: ${pts.length})</p></div>`;
    return;
  }
  const W = 700, H = 220, pad = 38;
  const accs = pts.map(d => d.accuracy);
  let lo = Math.min(...accs), hi = Math.max(...accs);
  if (hi - lo < 0.08) { const m = (hi + lo) / 2; lo = m - 0.05; hi = m + 0.05; }
  lo = Math.max(0, lo - 0.03); hi = Math.min(1, hi + 0.03);
  const sx = i => pad + (i / (pts.length - 1)) * (W - 2 * pad);
  const sy = v => (H - pad) - ((v - lo) / (hi - lo)) * (H - 2 * pad);
  const line = pts.map((d, i) => `${sx(i)},${sy(d.accuracy)}`).join(" ");
  const dots = pts.map((d, i) =>
    `<circle cx="${sx(i)}" cy="${sy(d.accuracy)}" r="3" fill="#C9F73E"/>`).join("");
  const yTicks = [lo, (lo + hi) / 2, hi].map(v =>
    `<text x="${pad - 6}" y="${sy(v) + 3}" fill="#5B6373" font-size="9" text-anchor="end">${Math.round(v * 100)}%</text>
     <line x1="${pad}" y1="${sy(v)}" x2="${W - pad}" y2="${sy(v)}" stroke="#1E232D"/>`).join("");
  const first = pts[0].date.slice(5), last = pts[pts.length - 1].date.slice(5);
  host.innerHTML = `<div class="hist-card"><h3>Evolución de la precisión (1X2)</h3>
    <svg class="hist-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de la precisión">
      ${yTicks}
      <polyline points="${line}" fill="none" stroke="#C9F73E" stroke-width="2"/>
      ${dots}
      <text x="${pad}" y="${H - 8}" fill="#5B6373" font-size="9">${first}</text>
      <text x="${W - pad}" y="${H - 8}" fill="#5B6373" font-size="9" text-anchor="end">${last}</text>
    </svg>
    <p class="hist-note">Cada punto es un día. Mide qué % de los partidos ya jugados habría acertado el modelo
    en su pronóstico 1X2. Es un historial real y verificable, no una estimación.</p></div>`;
}

/* ===================== Resultados recientes ===================== */
function buildRecentResults() {
  const host = document.getElementById("recent-results");
  if (!host) return;
  const played = DATA.matches.filter(m => m.status === "jugado" && m.real_score)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 16);
  if (!played.length) { host.innerHTML = ""; return; }
  const lbl = { home: "Local", draw: "Empate", away: "Visitante" };
  const rows = played.map(m => {
    const [, mo, da] = (m.date || "--").split("-");
    const mp = modelPick(m), rr = realResult(m);
    const hit = mp === rr;
    const pickName = mp === "home" ? m.home : mp === "away" ? m.away : "Empate";
    return `<div class="rr-row">
      <span class="rr-date">${da}/${mo}</span>
      <span class="rr-teams">${flag(m.home)} ${m.home} <span class="sc">${m.real_score}</span> ${m.away} ${flag(m.away)}</span>
      <span class="rr-pick">Modelo: <b>${pickName}</b></span>
      <span class="rr-mark ${hit ? "hit" : "miss"}">${hit ? "✓" : "✗"}</span>
    </div>`;
  }).join("");
  host.innerHTML = `<div class="section-head"><h2>Resultados recientes</h2>
    <p>Lo que el modelo pronosticó vs. lo que pasó, en los últimos partidos jugados. Transparencia total: se ven los aciertos y los fallos.</p></div>
    <div class="rr-wrap">${rows}</div>`;
}

/* ===================== Tu quiniela (pick'em vs. modelo) ===================== */
const QKEY = "quiniela_mundial2026";
function loadPicks() {
  try { return JSON.parse(localStorage.getItem(QKEY) || "{}") || {}; }
  catch (e) { return {}; }
}
function savePicks(p) {
  try { localStorage.setItem(QKEY, JSON.stringify(p)); } catch (e) {}
}
function setPick(id, choice) {
  const p = loadPicks();
  if (p[id] === choice) delete p[id]; else p[id] = choice;  // volver a tocar = quitar
  savePicks(p);
  buildQuiniela();
}

function buildQuiniela() {
  const host = document.getElementById("quiniela-panel");
  if (!host) return;
  const picks = loadPicks();
  const openMatches = DATA.matches.filter(m => m.status === "pendiente");
  // partidos ya jugados sobre los que el usuario hizo un pronóstico (para puntuar)
  const scored = DATA.matches.filter(m => m.status === "jugado" && picks[matchId(m)]);

  let yourHits = 0, modelHits = 0;
  scored.forEach(m => {
    const rr = realResult(m);
    if (picks[matchId(m)] === rr) yourHits++;
    if (modelPick(m) === rr) modelHits++;
  });
  const nPicked = Object.keys(picks).length;
  const acc = scored.length ? Math.round((yourHits / scored.length) * 100) : null;

  const lblFull = { home: "", draw: "Empate", away: "" };
  const optBtn = (m, key, label, prob) => {
    const id = matchId(m), sel = picks[id] === key;
    return `<button class="q-opt ${sel ? "sel" : ""}" data-id="${encodeURIComponent(id)}" data-k="${key}">
      ${label}<span class="q-mp">${pct(prob)}%</span></button>`;
  };

  let summary = "";
  if (scored.length) {
    const youWin = yourHits > modelHits, tie = yourHits === modelHits;
    summary = `<div class="q-summary">
      <div class="q-tile"><div class="qv">${nPicked}</div><div class="ql">Pronósticos</div></div>
      <div class="q-tile"><div class="qv">${yourHits}/${scored.length}</div><div class="ql">Tus aciertos</div></div>
      <div class="q-tile"><div class="qv pink">${modelHits}/${scored.length}</div><div class="ql">Acertó el modelo</div></div>
      <div class="q-tile"><div class="qv">${acc}%</div><div class="ql">Tu precisión</div></div>
    </div>
    <p class="q-vs">${tie ? "Vas <b>empatado</b> con el modelo" :
      youWin ? "¡Vas <b class='win'>ganándole</b> al modelo!" : "El <b class='lose'>modelo</b> va arriba por ahora"}</p>`;
  } else {
    summary = `<div class="q-summary">
      <div class="q-tile"><div class="qv">${nPicked}</div><div class="ql">Pronósticos hechos</div></div>
      <div class="q-tile"><div class="qv">${openMatches.length}</div><div class="ql">Partidos por pronosticar</div></div>
    </div>`;
  }

  const openCards = openMatches.map(m => {
    const id = matchId(m), mp = modelPick(m);
    const mpName = mp === "home" ? m.home : mp === "away" ? m.away : "Empate";
    const [, mo, da] = (m.date || "--").split("-");
    return `<div class="q-match">
      <div class="q-top"><span>${da}/${mo} · ${m.stage}</span><span>${m.ground || ""}</span></div>
      <div class="q-teams-line"><span class="fl">${flag(m.home)}</span> ${m.home}
        <span style="color:var(--txt-dim)">vs</span> ${m.away} <span class="fl">${flag(m.away)}</span></div>
      <div class="q-opts">
        ${optBtn(m, "home", "Gana " + m.home, m.p1x2.home)}
        ${optBtn(m, "draw", "Empate", m.p1x2.draw)}
        ${optBtn(m, "away", "Gana " + m.away, m.p1x2.away)}
      </div>
      <p class="q-model-pick">El modelo dice: <b>${mpName}</b></p>
    </div>`;
  }).join("");

  const scoredCards = scored.sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(m => {
    const id = matchId(m), rr = realResult(m), yp = picks[id], mp = modelPick(m);
    const nm = k => k === "home" ? m.home : k === "away" ? m.away : "Empate";
    const youOk = yp === rr, modelOk = mp === rr;
    return `<div class="q-match">
      <div class="q-top"><span>${m.stage}</span><span>Final ${m.real_score}</span></div>
      <div class="q-teams-line"><span class="fl">${flag(m.home)}</span> ${m.home}
        <span class="sc" style="font-family:'Space Mono';margin:0 6px">${m.real_score}</span>
        ${m.away} <span class="fl">${flag(m.away)}</span></div>
      <div class="q-result">
        <span>Tú: <b>${nm(yp)}</b> <span class="q-badge ${youOk ? "ok" : "no"}">${youOk ? "ACERTASTE" : "fallaste"}</span></span>
        <span>Modelo: <b>${nm(mp)}</b> <span class="q-badge ${modelOk ? "ok" : "no"}">${modelOk ? "✓" : "✗"}</span></span>
      </div>
    </div>`;
  }).join("");

  let body;
  if (!openMatches.length && !scored.length) {
    body = `<div class="q-empty">No hay partidos disponibles para pronosticar en este momento.
      Cuando se confirmen los próximos cruces, aparecerán aquí para que hagas tu quiniela.</div>`;
  } else {
    body = `${summary}
      ${openCards ? `<div class="section-head" style="margin-top:18px"><h2>Haz tu pronóstico</h2>
        <p>Elige quién gana cada partido. Tus pronósticos se guardan en tu dispositivo y se califican solos cuando se juega el partido. Compites contra el modelo.</p></div>${openCards}` : ""}
      ${scoredCards ? `<div class="section-head" style="margin-top:18px"><h2>Tus partidos calificados</h2>
        <p>Resultados de los partidos que pronosticaste.</p></div>${scoredCards}
        <button class="q-reset" id="q-reset">Borrar mis pronósticos</button>` : ""}`;
  }

  host.innerHTML = `<div class="q-wrap">
    <div class="section-head"><h2>🎯 Tu quiniela</h2>
      <p>Pronostica los partidos y mide tu acierto contra el modelo. Todo se guarda en tu navegador, sin cuentas ni registros.</p></div>
    ${body}</div>`;

  host.querySelectorAll(".q-opt").forEach(b => b.addEventListener("click", () =>
    setPick(decodeURIComponent(b.dataset.id), b.dataset.k)));
  const rb = document.getElementById("q-reset");
  if (rb) rb.addEventListener("click", () => {
    if (confirm("¿Borrar todos tus pronósticos guardados?")) { savePicks({}); buildQuiniela(); }
  });
}

/* ===================== Valor: modelo vs. mercado de referencia ===================== */
function buildValuePanel() {
  const host = document.getElementById("value-panel");
  if (!host) return;
  const lbl = { local: "Local", empate: "Empate", visitante: "Visitante" };
  const rows = [];
  DATA.matches.filter(m => m.status === "pendiente" && m.odds && m.odds.mercados).forEach(m => {
    m.odds.mercados.forEach(mk => {
      if (mk.ventaja_modelo > 0.02 || mk.apuesta_de_valor) {
        const pickName = mk.resultado === "local" ? m.home : mk.resultado === "visitante" ? m.away : "Empate";
        rows.push({ m, mk, pickName, edge: mk.ventaja_modelo });
      }
    });
  });
  rows.sort((a, b) => b.edge - a.edge);

  const disclaimer = `<div class="v-disclaimer"><b>⚠️ Solo informativo.</b> Los momios mostrados son una
    <b>línea de referencia estimada</b> por el propio modelo, no provienen de una casa de apuestas real ni son
    momios en vivo. Esto <b>no es consejo de apuestas</b>. "Valor" significa solo que el modelo asigna más
    probabilidad a ese resultado que la línea de referencia. Apostar implica riesgo real de pérdida.</div>`;

  if (!rows.length) {
    host.innerHTML = `<div class="v-wrap">
      <div class="section-head"><h2>💎 Valor: modelo vs. mercado</h2>
        <p>Dónde el modelo y la línea de referencia discrepan más entre los próximos partidos.</p></div>
      ${disclaimer}
      <div class="v-empty">Por ahora no hay diferencias destacables entre el modelo y la línea de referencia
      en los partidos próximos. Vuelve cuando se confirmen más cruces.</div></div>`;
    return;
  }

  const tr = rows.map(({ m, mk, pickName, edge }) => {
    const [, mo, da] = (m.date || "--").split("-");
    const e = edge * 100;
    return `<tr>
      <td class="vm">${flag(m.home)} ${m.home} vs ${m.away} ${flag(m.away)}<br>
        <span style="color:var(--txt-dim);font-size:.72rem">${da}/${mo} · ${m.stage}</span></td>
      <td class="vpick">${pickName}</td>
      <td class="num">${pct(mk.prob_modelo)}%</td>
      <td class="num">${pct(mk.prob_mercado)}%</td>
      <td class="num">${mk.momio.toFixed(2)}</td>
      <td><span class="v-edge ${e >= 0 ? "pos" : "neg"}">${e >= 0 ? "+" : ""}${e.toFixed(0)}%</span></td>
    </tr>`;
  }).join("");

  host.innerHTML = `<div class="v-wrap">
    <div class="section-head"><h2>💎 Valor: modelo vs. mercado</h2>
      <p>Dónde el modelo asigna más probabilidad que la línea de referencia, entre los próximos partidos. Ordenado por diferencia.</p></div>
    ${disclaimer}
    <div class="v-table-wrap"><table class="v-table">
      <thead><tr><th>Partido</th><th>Resultado</th><th>Modelo</th><th>Mercado</th><th>Momio</th><th>Ventaja</th></tr></thead>
      <tbody>${tr}</tbody>
    </table></div></div>`;
}

/* ===================== Parlay / combinada ===================== */
const PKEY = "parlay_mundial2026";
const PL_MARGIN = 0.06;                 // margen típico por selección (línea de referencia)
const RES_MAP = { home: "local", draw: "empate", away: "visitante" };

function loadParlay() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY) || "{}");
    if (!p.legs) p.legs = {};
    if (typeof p.stake !== "number") p.stake = 100;
    return p;
  } catch (e) { return { legs: {}, stake: 100 }; }
}
function saveParlay(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }

/* momio de referencia de una selección */
function odd1x2(m, k) {
  if (m.odds && m.odds.mercados) {
    const e = m.odds.mercados.find(x => x.resultado === RES_MAP[k]);
    if (e && e.momio > 1) return e.momio;
  }
  return null;
}
function legOdd(m, k, p) {
  if (k in RES_MAP) { const o = odd1x2(m, k); if (o) return o; }
  return Math.max(1.01, Math.round((1 / p) / (1 + PL_MARGIN) * 100) / 100);
}
function marketOptions(m) {
  const raw = [
    ["home", "Gana " + m.home, m.p1x2.home],
    ["draw", "Empate", m.p1x2.draw],
    ["away", "Gana " + m.away, m.p1x2.away],
    ["btts_yes", "Ambos anotan: Sí", m.btts.yes],
    ["btts_no", "Ambos anotan: No", 1 - m.btts.yes],
    ["over25", "Más de 2.5 goles", m.over_under["over_2.5"]],
    ["under25", "Menos de 2.5 goles", 1 - m.over_under["over_2.5"]],
  ];
  return raw.filter(([, , p]) => p > 0.02 && p < 0.995)
    .map(([k, label, p]) => ({ k, label, p, odd: legOdd(m, k, p) }));
}
function setLeg(m, opt) {
  const pl = loadParlay(), id = matchId(m);
  if (pl.legs[id] && pl.legs[id].k === opt.k) delete pl.legs[id];   // misma = quitar
  else pl.legs[id] = { mid: id, k: opt.k, label: opt.label,
                       mt: m.home + " vs " + m.away, date: m.date, p: opt.p, odd: opt.odd };
  saveParlay(pl); buildParlay();
}
function removeLeg(id) { const pl = loadParlay(); delete pl.legs[id]; saveParlay(pl); buildParlay(); }

const fmtP = x => x >= 0.1 ? (x * 100).toFixed(1) + "%" : (x * 100).toFixed(2) + "%";
const money = n => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildParlay() {
  const host = document.getElementById("parlay-panel");
  if (!host) return;
  const pl = loadParlay();
  const matches = DATA.matches.filter(m => m.status === "pendiente");
  const legs = Object.values(pl.legs);

  // ---- Constructor (lista de partidos con sus mercados) ----
  let builder;
  if (!matches.length) {
    builder = `<div class="v-empty">No hay partidos próximos con equipos confirmados para armar una combinada.
      En cuanto se definan los siguientes cruces aparecerán aquí.</div>`;
  } else {
    builder = matches.map(m => {
      const id = matchId(m), [, mo, da] = (m.date || "--").split("-");
      const selK = pl.legs[id] ? pl.legs[id].k : null;
      const opts = marketOptions(m).map(o =>
        `<button class="pl-mkt ${selK === o.k ? "sel" : ""}" data-id="${encodeURIComponent(id)}" data-k="${o.k}">
          ${o.label} <span class="od">${o.odd.toFixed(2)}</span><span class="pp">(${pct(o.p)}%)</span></button>`).join("");
      return `<div class="pl-match">
        <div class="pl-mhead"><span>${da}/${mo} · ${m.stage}</span><span>${m.ground || ""}</span></div>
        <div class="pl-mteams"><span class="fl">${flag(m.home)}</span> ${m.home}
          <span style="color:var(--txt-dim)">vs</span> ${m.away} <span class="fl">${flag(m.away)}</span></div>
        <div class="pl-mkts">${opts}</div>
      </div>`;
    }).join("");
  }

  // ---- Boleto ----
  let pComb = 1, oComb = 1;
  legs.forEach(l => { pComb *= l.p; oComb *= l.odd; });
  const stake = pl.stake || 0;
  const payout = stake * oComb, profit = payout - stake;

  let slipInner;
  if (!legs.length) {
    slipInner = `<div class="pl-empty-slip">Tu combinada está vacía.<br>
      Toca los mercados de la izquierda para agregar selecciones. Puedes combinar resultados de distintos partidos.</div>`;
  } else {
    const legRows = legs.map(l => `<div class="pl-leg">
      <div class="pl-leg-main">
        <div class="pl-leg-mk">${l.label}</div>
        <div class="pl-leg-mt">${l.mt} · ${pct(l.p)}% modelo</div>
      </div>
      <span class="pl-leg-od">${l.odd.toFixed(2)}</span>
      <button class="pl-leg-x" data-id="${encodeURIComponent(l.mid)}" title="Quitar">✕</button>
    </div>`).join("");
    const impliedOdd = oComb > 0 ? 1 / oComb : 0;
    slipInner = `
      <div class="pl-legs">${legRows}</div>
      <div class="pl-summary">
        <div class="pl-row"><span class="lab">Selecciones</span><span class="val">${legs.length}</span></div>
        <div class="pl-row"><span class="lab">Probabilidad (modelo)</span><span class="val">${fmtP(pComb)}</span></div>
        <div class="pl-row"><span class="lab">Prob. implícita del momio</span><span class="val">${fmtP(impliedOdd)}</span></div>
        <div class="pl-row big"><span class="lab">Momio combinado</span><span class="val">${oComb.toFixed(2)}</span></div>
        <div class="pl-stake">
          <label for="pl-stake-input">Importe</label>
          <input id="pl-stake-input" type="number" min="0" step="10" value="${stake}" inputmode="decimal">
        </div>
        <div class="pl-payout">
          <div class="pl-row" style="margin-bottom:6px"><span class="lab">Ganancia potencial</span><span class="val" id="pl-profit">${money(profit)}</span></div>
          <div class="pl-row big" style="margin-bottom:0"><span class="lab">Retorno total</span><span class="val" id="pl-total">${money(payout)}</span></div>
        </div>
        <button class="pl-clear" id="pl-clear">Vaciar combinada</button>
      </div>`;
  }

  host.innerHTML = `<div class="pl-wrap">
    <div class="section-head"><h2>🎲 Creador de combinada (parlay)</h2>
      <p>Combina selecciones de distintos partidos. El sitio multiplica las probabilidades del modelo para estimar
      qué tan probable es que toda la combinada se cumpla, y calcula el momio de referencia y tu retorno potencial.</p></div>
    <div class="v-disclaimer"><b>⚠️ Solo informativo.</b> Los momios son una <b>línea de referencia estimada</b>,
      no provienen de ninguna casa de apuestas en particular ni son momios en vivo. Esto <b>no es consejo de apuestas</b>.
      El cálculo asume que las selecciones son <b>independientes entre sí</b> (por eso se permite solo una selección por
      partido). Una combinada es más difícil de acertar conforme agregas selecciones. Apostar implica riesgo real de pérdida.</div>
    <div class="pl-grid">
      <div class="pl-builder">${builder}</div>
      <aside class="pl-slip">
        <h3>Tu combinada <span class="pl-count">${legs.length} sel.</span></h3>
        ${slipInner}
        <p class="pl-note">El momio combinado es el producto de los momios de cada selección. La probabilidad del
        modelo es el producto de cada probabilidad individual.</p>
      </aside>
    </div></div>`;

  // ---- Interacciones ----
  host.querySelectorAll(".pl-mkt").forEach(b => b.addEventListener("click", () => {
    const id = decodeURIComponent(b.dataset.id);
    const m = DATA.matches.find(x => matchId(x) === id);
    if (!m) return;
    const opt = marketOptions(m).find(o => o.k === b.dataset.k);
    if (opt) setLeg(m, opt);
  }));
  host.querySelectorAll(".pl-leg-x").forEach(b =>
    b.addEventListener("click", () => removeLeg(decodeURIComponent(b.dataset.id))));
  const clr = document.getElementById("pl-clear");
  if (clr) clr.addEventListener("click", () => {
    if (confirm("¿Vaciar tu combinada?")) { const p = loadParlay(); p.legs = {}; saveParlay(p); buildParlay(); }
  });
  // Importe: actualiza montos sin re-render (no pierde el foco)
  const stakeInput = document.getElementById("pl-stake-input");
  if (stakeInput) stakeInput.addEventListener("input", () => {
    let v = parseFloat(stakeInput.value);
    if (isNaN(v) || v < 0) v = 0;
    const p = loadParlay(); p.stake = v; saveParlay(p);
    const pay = v * oComb;
    const totalEl = document.getElementById("pl-total");
    const profitEl = document.getElementById("pl-profit");
    if (totalEl) totalEl.textContent = money(pay);
    if (profitEl) profitEl.textContent = money(pay - v);
  });
}

document.addEventListener("DOMContentLoaded", init);
