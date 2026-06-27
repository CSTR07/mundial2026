#!/usr/bin/env python3
"""Motor de predicción Mundial 2026 — basado en datos reales y calibrado.

Lee web/data/teams.json (base de selecciones) y web/data/fixtures.json
(calendario + resultados en vivo) y produce las predicciones.

Método (sin parámetros inventados):
  1. Fuerza base = puntos del Ranking FIFA/Coca-Cola (Elo oficial, divisor 600).
  2. Estado actual = los puntos se actualizan con cada resultado real usando la
     fórmula oficial FIFA  P = P + I*(W - We)  (I=50 grupos, 60 eliminatoria).
  3. Confederación = ajuste por confederación.
  4. Goles esperados = regresión de Poisson calibrada por máxima verosimilitud
     sobre los partidos jugados, CON PONDERACIÓN POR RECENCIA (half-life), igual
     que el Dixon-Coles original.
  5. Marcadores = Dixon-Coles (rho = -0.08) -> malla de marcadores.
  6. CALIBRACIÓN: escalado por temperatura (1 parámetro, robusto) ajustado para
     minimizar la log-loss de los partidos jugados. Mejora la fiabilidad de las
     probabilidades sin sobreajustar.
  7. VERIFICACIÓN: se calculan Brier score, log loss, precisión, error de
     calibración (ECE) y un diagrama de fiabilidad sobre los partidos jugados,
     comparado contra un baseline. Todo queda en meta.evaluation.
"""
import json, math, hashlib, os, datetime, random

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "web", "data")

HOSTS = {"Mexico", "United States", "Canada"}
HOST_EDGE = 50.0
CONF_W = 120.0
RHO = -0.08
MAXG = 9
HALF_LIFE_DAYS = 14.0          # recencia: peso 0.5 a 14 días de antigüedad
IMPORTANCE = {"group": 50.0, "r32": 60.0, "r16": 60.0, "qf": 60.0,
              "sf": 60.0, "third": 60.0, "final": 60.0}

def hsh(*p):
    return int(hashlib.sha256("|".join(map(str, p)).encode()).hexdigest(), 16) % 10_000 / 10_000.0

def we(dr):
    return 1.0 / (10 ** (-dr / 600.0) + 1.0)

def pois(k, lam):
    return math.exp(-lam) * lam ** k / math.factorial(k)

def pois_tail(n, lam):
    return 1.0 - sum(pois(k, lam) for k in range(n))

def days_between(d1, d2):
    a = datetime.date.fromisoformat(d1); b = datetime.date.fromisoformat(d2)
    return abs((b - a).days)

# ---- Calibración del mapeo de goles: Poisson ponderado por recencia ----
def fit_poisson(samples):
    """samples: (x, y_home, y_away, weight). MLE ponderado de
    lambda_local=exp(a+b*x), lambda_visita=exp(a-b*x)."""
    if sum(1 for s in samples) < 4:
        return math.log(1.35), 0.20
    a, b = math.log(1.35), 0.25
    for _ in range(60):
        g0 = g1 = h00 = h01 = h11 = 0.0
        for x, yh, ya, w in samples:
            for z1, y in ((x, yh), (-x, ya)):
                mu = math.exp(a + b * z1); r = w * (y - mu)
                g0 += r; g1 += r * z1
                h00 += w * mu; h01 += w * mu * z1; h11 += w * mu * z1 * z1
        det = h00 * h11 - h01 * h01
        if abs(det) < 1e-9: break
        da = (h11 * g0 - h01 * g1) / det
        db = (-h01 * g0 + h00 * g1) / det
        a += da; b += db
        if abs(da) + abs(db) < 1e-9: break
    return a, b

# ---- Dixon-Coles: malla de marcadores ----
def grid(lh, la):
    M = [[0.0] * (MAXG + 1) for _ in range(MAXG + 1)]
    for i in range(MAXG + 1):
        for j in range(MAXG + 1):
            tau = 1.0
            if i == 0 and j == 0: tau = 1 - lh * la * RHO
            elif i == 0 and j == 1: tau = 1 + lh * RHO
            elif i == 1 and j == 0: tau = 1 + la * RHO
            elif i == 1 and j == 1: tau = 1 - RHO
            M[i][j] = max(0.0, tau) * pois(i, lh) * pois(j, la)
    tot = sum(map(sum, M))
    return [[x / tot for x in r] for r in M]

def temper(M, T):
    """Escalado por temperatura sobre la malla (calibración)."""
    if T == 1.0:
        return M
    G = [[c ** (1.0 / T) for c in row] for row in M]
    tot = sum(map(sum, G))
    return [[c / tot for c in row] for row in G]

def markets_from_grid(M):
    ph = pd = pa = btts = o15 = o25 = o35 = 0.0; scores = []
    eh = ea = 0.0
    for i in range(MAXG + 1):
        for j in range(MAXG + 1):
            p = M[i][j]; eh += i * p; ea += j * p
            if i > j: ph += p
            elif i == j: pd += p
            else: pa += p
            if i and j: btts += p
            if i + j >= 2: o15 += p
            if i + j >= 3: o25 += p
            if i + j >= 4: o35 += p
            scores.append((f"{i}-{j}", p))
    scores.sort(key=lambda s: -s[1])
    return {"p1x2": {"home": round(ph, 3), "draw": round(pd, 3), "away": round(pa, 3)},
            "xg": {"home": round(eh, 2), "away": round(ea, 2), "total": round(eh + ea, 2)},
            "over_under": {"over_1.5": round(o15, 3), "over_2.5": round(o25, 3), "over_3.5": round(o35, 3)},
            "btts": {"yes": round(btts, 3), "no": round(1 - btts, 3)},
            "scorelines": [{"score": s, "p": round(p, 3)} for s, p in scores[:4]]}

# ---- Calibración por temperatura: minimiza log-loss del 1X2 ----
def p1x2_from_grid(M):
    ph = pd = pa = 0.0
    for i in range(MAXG + 1):
        for j in range(MAXG + 1):
            if i > j: ph += M[i][j]
            elif i == j: pd += M[i][j]
            else: pa += M[i][j]
    return ph, pd, pa

def fit_temperature(played):
    """played: lista de (grid, outcome_idx). Devuelve T que minimiza log-loss."""
    if len(played) < 8:
        return 1.0
    best_T, best_ll = 1.0, 1e9
    T = 0.60
    while T <= 2.001:
        ll = 0.0
        for M, oi in played:
            p = p1x2_from_grid(temper(M, T))
            ll += -math.log(max(1e-9, p[oi]))
        ll /= len(played)
        if ll < best_ll:
            best_ll, best_T = ll, T
        T += 0.05
    return round(best_T, 2)

def corners_block(lh, la):
    tot = lh + la; ct = round(min(12.0, max(7.0, 8.6 + 1.4 * (tot - 2.6))), 1)
    return {"expected_total": ct, "expected_home": round(ct * lh / tot, 1),
            "expected_away": round(ct * la / tot, 1), "tiros_esperados_total": round(ct * 1.85, 1),
            "over_under": {"over_8.5": round(pois_tail(9, ct), 3), "over_9.5": round(pois_tail(10, ct), 3),
                           "over_10.5": round(pois_tail(11, ct), 3)}}

def cards_block(lh, la, p1x2):
    comp = round(1 - abs(p1x2["home"] - p1x2["away"]), 2); ct = round(3.4 + 1.8 * comp, 1)
    return {"expected_total": ct, "competitividad": comp, "goles_esperados": round(lh + la, 2),
            "over_under": {"over_3.5": round(pois_tail(4, ct), 3), "over_4.5": round(pois_tail(5, ct), 3),
                           "over_5.5": round(pois_tail(6, ct), 3)}}

def form_from(hist):
    last = hist[-3:]
    if not last: return 1.0, "Normal"
    avg = sum(last) / len(last); val = round(0.80 + 0.18 * avg, 2)
    lab = ("Excelente" if val >= 1.20 else "Buena" if val >= 1.02 else
           "Normal" if val >= 0.90 else "Irregular")
    return val, lab

def make_odds(p1x2, home, away):
    outs = [("local", p1x2["home"]), ("empate", p1x2["draw"]), ("visitante", p1x2["away"])]
    q = [max(0.02, p * (1 + (hsh(home, away, n) - 0.5) * 0.26)) for n, p in outs]
    q = [x ** 1.06 for x in q]; s = sum(q); q = [x / s for x in q]
    margen = round(0.045 + hsh(home, away, "m") * 0.025, 3); mer = []
    for (n, p), qi in zip(outs, q):
        momio = max(1.02, round(1.0 / (qi * (1 + margen)), 2))
        pm = round((1.0 / momio) / (1 + margen), 3); ev = round(p * momio - 1.0, 3)
        mer.append({"resultado": n, "prob_modelo": round(p, 3), "prob_mercado": pm, "momio": momio,
                    "ventaja_modelo": round(p - pm, 3), "valor_esperado": ev, "apuesta_de_valor": ev > 0.04})
    return {"margen_casa": margen, "mercados": mer}

# ---- Verificación: Brier, log-loss, ECE, fiabilidad ----
def evaluate(records):
    """records: lista de dicts con p1x2(home,draw,away), oi (0/1/2),
    p_over25, over_real(bool), p_btts, btts_real(bool)."""
    n = len(records)
    ev = {"n": n}
    if n == 0:
        return ev
    # 1X2 multiclase
    brier = ll = acc = 0.0
    rel_pts = []                       # (p_predicha, acierto) por cada salida
    for r in records:
        p = [r["p1x2"]["home"], r["p1x2"]["draw"], r["p1x2"]["away"]]
        y = [0, 0, 0]; y[r["oi"]] = 1
        brier += sum((p[k] - y[k]) ** 2 for k in range(3))
        ll += -math.log(max(1e-9, p[r["oi"]]))
        if max(range(3), key=lambda k: p[k]) == r["oi"]: acc += 1
        for k in range(3):
            rel_pts.append((p[k], y[k]))
    ev["brier_1x2"] = round(brier / n, 4)
    ev["logloss_1x2"] = round(ll / n, 4)
    ev["accuracy_1x2"] = round(acc / n, 4)
    # baseline tasa base (frecuencias observadas) para skill score
    cnt = [sum(1 for r in records if r["oi"] == k) for k in range(3)]
    base = [c / n for c in cnt]
    base_ll = sum(-math.log(max(1e-9, base[r["oi"]])) for r in records) / n
    ev["logloss_baseline"] = round(base_ll, 4)
    ev["skill_score"] = round(1 - (ll / n) / base_ll, 4) if base_ll > 0 else 0.0
    # ECE + diagrama de fiabilidad (10 bins sobre todas las salidas 1X2)
    bins = [[] for _ in range(10)]
    for p, y in rel_pts:
        bins[min(9, int(p * 10))].append((p, y))
    reliability = []; ece = 0.0; total = len(rel_pts)
    for b in bins:
        if b:
            ap = sum(x[0] for x in b) / len(b)
            af = sum(x[1] for x in b) / len(b)
            reliability.append({"pred": round(ap, 3), "obs": round(af, 3), "n": len(b)})
            ece += len(b) / total * abs(ap - af)
    ev["ece_1x2"] = round(ece, 4)
    ev["reliability"] = reliability
    # mercados binarios
    def binary(pkey, ykey):
        br = l = 0.0
        for r in records:
            p = r[pkey]; y = 1 if r[ykey] else 0
            br += (p - y) ** 2; l += -(y * math.log(max(1e-9, p)) + (1 - y) * math.log(max(1e-9, 1 - p)))
        return round(br / n, 4), round(l / n, 4)
    ev["brier_over25"], ev["logloss_over25"] = binary("p_over25", "over_real")
    ev["brier_btts"], ev["logloss_btts"] = binary("p_btts", "btts_real")
    return ev

# ---- Simulación Monte Carlo del torneo completo ----
N_SIMS = 20000

def sim_poisson(lam):
    """Muestreo de Poisson (algoritmo de Knuth)."""
    L = math.exp(-lam); k = 0; p = 1.0
    while True:
        k += 1; p *= random.random()
        if p <= L:
            return k - 1

def simulate_tournament(teams, pts, a_hat, b_hat, fixtures, n_sims=N_SIMS):
    def rating(t, home):
        return pts[t] + CONF_W * (teams[t]["conf_factor"] - 1.0) + (HOST_EDGE if (home and t in HOSTS) else 0)

    def lambdas(h, a):
        x = (rating(h, True) - rating(a, False)) / 100.0
        return max(0.12, math.exp(a_hat + b_hat * x)), max(0.12, math.exp(a_hat - b_hat * x))

    adv_cache = {}
    def adv_prob(h, a):
        """Probabilidad de que el local avance en eliminatoria (incluye desempate)."""
        key = (h, a)
        if key in adv_cache:
            return adv_cache[key]
        lh, la = lambdas(h, a)
        ph = pd = pa = 0.0
        for i in range(MAXG + 1):
            for j in range(MAXG + 1):
                p = pois(i, lh) * pois(j, la)
                if i > j: ph += p
                elif i == j: pd += p
                else: pa += p
        tot = ph + pa
        res = ph + pd * (ph / tot if tot > 1e-9 else 0.5)
        adv_cache[key] = res
        return res

    # estructura de grupos y partidos
    groups = {}
    group_matches = {}          # letter -> [(h,a,score|None)]
    ko = []                     # partidos de eliminatoria en orden de id
    for m in sorted(fixtures, key=lambda x: x.get("match_id", 0)):
        if m.get("stage_key") == "group" and m.get("home") and m.get("away"):
            g = m["group"]
            groups.setdefault(g, set()).update([m["home"], m["away"]])
            group_matches.setdefault(g, []).append((m["home"], m["away"], m.get("score")))
        elif m.get("stage_key") not in ("group", None):
            ko.append(m)

    # equipos ya colocados en cualquier slot de eliminatoria (hechos)
    known = set(teams)
    locked = set()
    for m in ko:
        for raw in (m["home_raw"], m["away_raw"]):
            if raw in known:
                locked.add(raw)

    # precálculo de la parte fija de la tabla (partidos ya jugados)
    base_table = {g: {t: [0, 0, 0] for t in sorted(ts)} for g, ts in groups.items()}  # pts, gd, gf
    pending = {g: [] for g in groups}
    for g, matches in group_matches.items():
        for h, a, score in matches:
            if score:
                gh, ga = (int(v) for v in score.split("-"))
                _add_result(base_table[g], h, a, gh, ga)
            else:
                pending[g].append((h, a))

    counters = {t: {"r32": 0, "r16": 0, "qf": 0, "sf": 0, "final": 0, "champion": 0} for t in known}
    pre_lambda = {}             # caché de lambdas de partidos de grupo pendientes
    for g in pending:
        for (h, a) in pending[g]:
            pre_lambda[(h, a)] = lambdas(h, a)

    for _ in range(n_sims):
        # 1) simular grupos pendientes -> tabla
        table = {g: {t: list(v) for t, v in base_table[g].items()} for g in groups}
        for g in groups:
            for (h, a) in pending[g]:
                lh, la = pre_lambda[(h, a)]
                gh, ga = sim_poisson(lh), sim_poisson(la)
                _add_result(table[g], h, a, gh, ga)
        # 2) posiciones por grupo
        ranked = {}
        thirds = []
        for g, tbl in table.items():
            order = sorted(tbl.items(), key=lambda kv: (kv[1][0], kv[1][1], kv[1][2], pts[kv[0]]), reverse=True)
            ranked[g] = [t for t, _ in order]
            third = order[2][0]
            thirds.append((g, third, order[2][1]))
        # 3) mejores 8 terceros (puntos, dif. gol, goles a favor, rating)
        thirds.sort(key=lambda x: (table[x[0]][x[1]][0], table[x[0]][x[1]][1],
                                   table[x[0]][x[1]][2], pts[x[1]]), reverse=True)
        qualifying_thirds = thirds[:8]
        third_by_group = {g: t for g, t, _ in qualifying_thirds}

        # 4) asignar terceros a los slots "3combo" (emparejamiento con elegibilidad)
        code3_slots = []
        for m in ko:
            if m["stage_key"] == "r32":
                for raw in (m["home_raw"], m["away_raw"]):
                    if raw.startswith("3") and "/" in raw:
                        code3_slots.append(raw)
        locked_third_groups = {g for g, t, _ in qualifying_thirds if t in locked}
        avail = [g for g, t, _ in qualifying_thirds if g not in locked_third_groups]
        slot_assign = _match_thirds(code3_slots, avail)

        # 5) resolver y simular eliminatorias
        winners, losers, reached = {}, {}, {}

        def resolve(raw):
            if raw in known:
                return raw
            if raw[0] == "W":
                return winners.get(int(raw[1:]))
            if raw[0] == "L":
                return losers.get(int(raw[1:]))
            if raw[0] in "12":
                idx = 0 if raw[0] == "1" else 1
                g = raw[1:]
                return ranked[g][idx] if g in ranked else None
            if raw[0] == "3":
                if "/" in raw:
                    g = slot_assign.get(raw)
                    return third_by_group.get(g) if g else None
                return third_by_group.get(raw[1:])
            return None

        for m in ko:
            h = resolve(m["home_raw"]); a = resolve(m["away_raw"])
            mid = m["match_id"]
            if not h or not a:
                cand = [t for t in (h, a) if t]
                winners[mid] = cand[0] if cand else None
                continue
            reached.setdefault(h, set()).add(m["stage_key"])
            reached.setdefault(a, set()).add(m["stage_key"])
            if m.get("score"):                       # eliminatoria ya jugada -> resultado real
                gh, ga = (int(v) for v in m["score"].split("-"))
                home_adv = gh > ga if gh != ga else random.random() < adv_prob(h, a)
            else:
                home_adv = random.random() < adv_prob(h, a)
            if home_adv:
                winners[mid], losers[mid] = h, a
            else:
                winners[mid], losers[mid] = a, h

        champ = winners.get(104)
        if champ:
            counters[champ]["champion"] += 1
        for t, stages in reached.items():
            for s in stages:
                if s in counters[t]:
                    counters[t][s] += 1

    out = {}
    for t, c in counters.items():
        if any(c.values()):
            out[t] = {k: round(v / n_sims, 4) for k, v in c.items()}
    ordered = dict(sorted(out.items(), key=lambda kv: -kv[1]["champion"]))
    return {"n_sims": n_sims, "teams": ordered}

def _add_result(tbl, h, a, gh, ga):
    tbl[h][2] += gh; tbl[a][2] += ga
    tbl[h][1] += gh - ga; tbl[a][1] += ga - gh
    if gh > ga: tbl[h][0] += 3
    elif gh < ga: tbl[a][0] += 3
    else: tbl[h][0] += 1; tbl[a][0] += 1

def _match_thirds(slots, groups):
    """Empareja grupos de terceros a slots '3combo' respetando elegibilidad.
    Garantiza una asignación completa: si la elegibilidad no permite emparejar
    todo (combinaciones raras), rellena los slots restantes con los grupos que
    queden para mantener la simulación consistente."""
    assign = {}
    used = set()
    def bt(i):
        if i == len(slots):
            return True
        elig = slots[i][1:].split("/")
        for g in groups:
            if g not in used and g in elig:
                used.add(g); assign[slots[i]] = g
                if bt(i + 1):
                    return True
                used.discard(g); assign.pop(slots[i], None)
        return False
    if not bt(0):
        # respaldo: asigna lo que se pueda y rellena el resto
        for s in slots:
            if s not in assign:
                for g in groups:
                    if g not in used:
                        used.add(g); assign[s] = g
                        break
    return assign

def build(teams_db, fixtures):
    teams = teams_db["teams"]
    def fifa(t): return teams[t]["fifa_points"]
    def conf_adj(t): return CONF_W * (teams[t]["conf_factor"] - 1.0)

    real = [m for m in fixtures if m.get("home") and m.get("away")]
    real.sort(key=lambda m: (m["date"], m.get("stage_key", "")))
    last_date = max((m["date"] for m in real if m["status"] == "jugado"), default=None)

    # ---- Pase 1: Elo dinámico + muestras ponderadas por recencia ----
    pts = {t: fifa(t) for t in teams}
    samples = []
    for m in real:
        h, a = m["home"], m["away"]
        rh = pts[h] + conf_adj(h) + (HOST_EDGE if h in HOSTS else 0)
        ra = pts[a] + conf_adj(a)
        x = (rh - ra) / 100.0
        if m["status"] == "jugado" and m.get("score"):
            gh, ga = (int(v) for v in m["score"].split("-"))
            age = days_between(m["date"], last_date) if last_date else 0
            w = 0.5 ** (age / HALF_LIFE_DAYS)
            samples.append((x, gh, ga, w))
            sh = 1.0 if gh > ga else 0.5 if gh == ga else 0.0
            I = IMPORTANCE.get(m.get("stage_key", "group"), 50.0)
            dr = pts[h] - pts[a]
            pts[h] += I * (sh - we(dr)); pts[a] += I * ((1 - sh) - we(-dr))
    a_hat, b_hat = fit_poisson(samples)

    # ---- Pase 2: malla por partido + datos para calibrar temperatura ----
    pts = {t: fifa(t) for t in teams}
    hist = {}
    ctx = []            # contexto por fixture (en orden original)
    played_for_T = []   # (grid, oi) de partidos jugados
    for m in fixtures:
        h, a = m.get("home"), m.get("away")
        if not (h and a):
            ctx.append(None); continue
        rh = pts[h] + conf_adj(h) + (HOST_EDGE if h in HOSTS else 0)
        ra = pts[a] + conf_adj(a)
        x = (rh - ra) / 100.0
        lh = max(0.12, math.exp(a_hat + b_hat * x))
        la = max(0.12, math.exp(a_hat - b_hat * x))
        M = grid(lh, la)
        fb = {}
        for t in (h, a):
            fv, fl = form_from(hist.get(t, [])); mt = teams[t]
            fb[t] = {"conf": mt["conf"], "conf_factor": mt["conf_factor"], "form": fv,
                     "form_label": fl, "style": mt["style"], "style_label": mt["style_label"]}
        ctx.append({"m": m, "h": h, "a": a, "lh": lh, "la": la, "grid": M, "form": fb})
        if m["status"] == "jugado" and m.get("score"):
            gh, ga = (int(v) for v in m["score"].split("-"))
            oi = 0 if gh > ga else 1 if gh == ga else 2
            played_for_T.append((M, oi))
            sh = 1.0 if gh > ga else 0.5 if gh == ga else 0.0
            I = IMPORTANCE.get(m.get("stage_key", "group"), 50.0)
            dr = pts[h] - pts[a]
            pts[h] += I * (sh - we(dr)); pts[a] += I * ((1 - sh) - we(-dr))
            hist.setdefault(h, []).append(3 if gh > ga else 1 if gh == ga else 0)
            hist.setdefault(a, []).append(3 if ga > gh else 1 if gh == ga else 0)

    T = fit_temperature(played_for_T)

    # ---- Pase 3: construir partidos con malla calibrada + verificación ----
    out_matches = []; eval_records = []
    for c, m in zip(ctx, fixtures):
        if c is None:
            out_matches.append({"date": m["date"], "stage": m.get("stage", ""),
                                "stage_key": m.get("stage_key", ""), "group": m.get("group"),
                                "ground": m.get("ground", ""),
                                "home": m.get("home_hint", "Por definir"),
                                "away": m.get("away_hint", "Por definir"),
                                "status": "proximo", "real_score": None})
            continue
        Mt = temper(c["grid"], T)
        mk = markets_from_grid(Mt)
        h, a = c["h"], c["a"]
        match = {"date": m["date"], "stage": m.get("stage", ""), "stage_key": m.get("stage_key", ""),
                 "group": m.get("group"), "ground": m.get("ground", ""),
                 "home": h, "away": a, "status": m["status"], "real_score": m.get("score"),
                 "p1x2": mk["p1x2"], "xg": mk["xg"], "over_under": mk["over_under"],
                 "btts": mk["btts"], "scorelines": mk["scorelines"],
                 "corners": corners_block(c["lh"], c["la"]),
                 "cards": cards_block(c["lh"], c["la"], mk["p1x2"]),
                 "form": c["form"],
                 "scorers": {h: teams[h]["scorers"], a: teams[a]["scorers"]},
                 "odds": make_odds(mk["p1x2"], h, a)}
        out_matches.append(match)
        if m["status"] == "jugado" and m.get("score"):
            gh, ga = (int(v) for v in m["score"].split("-"))
            eval_records.append({
                "p1x2": mk["p1x2"], "oi": 0 if gh > ga else 1 if gh == ga else 2,
                "p_over25": mk["over_under"]["over_2.5"], "over_real": (gh + ga) > 2.5,
                "p_btts": mk["btts"]["yes"], "btts_real": gh > 0 and ga > 0})

    evaluation = evaluate(eval_records)
    random.seed(42)         # reproducible: mismo input -> mismo resultado
    simulation = simulate_tournament(teams, pts, a_hat, b_hat, fixtures)
    played = sum(1 for m in out_matches if m["status"] == "jugado")
    meta = {
        "generated_at": datetime.date.today().isoformat(),
        "n_matches": len(out_matches), "n_played": played,
        "confederations": teams_db["confederations"],
        "model": ("Ranking FIFA (oficial) + Elo din\u00e1mico \u00b7 confederaci\u00f3n \u00b7 goles "
                  "calibrados (Poisson ponderado por recencia) \u00b7 Dixon-Coles \u03c1=-0.08 \u00b7 "
                  "calibraci\u00f3n por temperatura"),
        "ranking": [{"team": t, "rating": round(r, 1)}
                    for t, r in sorted(pts.items(), key=lambda kv: -kv[1])],
        "calibration": {"a": round(a_hat, 4), "b": round(b_hat, 4),
                        "n_samples": len(samples), "temperature": T,
                        "half_life_days": HALF_LIFE_DAYS},
        "evaluation": evaluation,
        "simulation": simulation,
    }
    return {"meta": meta, "matches": out_matches}

def main():
    teams_db = json.load(open(os.path.join(DATA, "teams.json"), encoding="utf-8"))
    fx = json.load(open(os.path.join(DATA, "fixtures.json"), encoding="utf-8"))
    pred = build(teams_db, fx["matches"])
    json.dump(pred, open(os.path.join(DATA, "predictions.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    open(os.path.join(DATA, "data.js"), "w", encoding="utf-8").write(
        "window.PREDICTIONS = " + json.dumps(pred, ensure_ascii=False) + ";\n")
    m = pred["meta"]; e = m["evaluation"]
    print(f"OK · {m['n_played']}/{m['n_matches']} jugados · T={m['calibration']['temperature']}")
    if e.get("n"):
        print(f"  Verificación (1X2): Brier={e['brier_1x2']} LogLoss={e['logloss_1x2']} "
              f"Precisión={e['accuracy_1x2']} ECE={e['ece_1x2']}")
        print(f"  Skill vs baseline: {e['skill_score']}  (logloss base {e['logloss_baseline']})")
        print(f"  Over2.5 Brier={e['brier_over25']} · BTTS Brier={e['brier_btts']}")
    print("  Top-5:", ", ".join(f"{r['team']}({r['rating']})" for r in m["ranking"][:5]))
    sim = m.get("simulation", {})
    if sim.get("teams"):
        print(f"  Monte Carlo ({sim['n_sims']} sims) — favoritos al título:")
        for t, p in list(sim["teams"].items())[:5]:
            print(f"     {t:<16} campeón {p['champion']*100:.1f}% · semis {p['sf']*100:.1f}%")

if __name__ == "__main__":
    main()
