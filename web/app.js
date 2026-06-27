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
  buildStageFilters();
  buildDateFilters();
  buildStatusFilters();
  render();
}

function setFooterDate() {
  const el = document.getElementById("data-timestamp");
  if (!el || !DATA.meta || !DATA.meta.generated_at) return;
  const d = new Date(DATA.meta.generated_at + "T00:00:00");
  el.textContent = "Datos actualizados: " + (isNaN(d) ? DATA.meta.generated_at :
    d.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }));
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

document.addEventListener("DOMContentLoaded", init);
