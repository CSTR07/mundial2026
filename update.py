#!/usr/bin/env python3
"""Actualizador autónomo — Mundial 2026.

Descarga el calendario y los resultados en vivo desde una fuente pública de
dominio público (openfootball/worldcup.json), los normaliza al formato del
proyecto (web/data/fixtures.json) y ejecuta el modelo para regenerar las
predicciones. Pensado para correr solo dentro de un GitHub Action.

Maneja fase de grupos y eliminatorias: los partidos de eliminatoria cuyos
equipos todavía no se definen se conservan como "proximo" para anticipar el
bracket; en cuanto la fuente publica los equipos reales, el modelo los predice.
"""
import json, os, sys, datetime, urllib.request, urllib.error

# Determinismo: relanza una vez con PYTHONHASHSEED fijo para que la simulación
# Monte Carlo dé el mismo resultado en cada corrida (evita commits sin cambios reales).
if os.environ.get("PYTHONHASHSEED") != "0":
    os.environ["PYTHONHASHSEED"] = "0"
    os.execv(sys.executable, [sys.executable] + sys.argv)

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "web", "data")

SOURCES = [
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
    "https://raw.githubusercontent.com/upbound-web/worldcup-live.json/master/2026/worldcup.json",
]

# nombres de la fuente -> nombres del proyecto
NAME_MAP = {"USA": "United States", "Bosnia & Herzegovina": "Bosnia and Herzegovina"}

# ronda de la fuente -> (clave, etiqueta corta en español)
ROUND_MAP = {
    "Round of 32": ("r32", "16vos"), "Round of 16": ("r16", "8vos"),
    "Quarter-final": ("qf", "4tos"), "Semi-final": ("sf", "Semis"),
    "Match for third place": ("third", "3er lugar"), "Final": ("final", "Final"),
}

def fetch():
    last = None
    for url in SOURCES:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "wc2026-bot"})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = json.loads(r.read().decode("utf-8"))
            if data.get("matches"):
                print(f"Fuente OK: {url}  ({len(data['matches'])} partidos)")
                return data
        except (urllib.error.URLError, ValueError, TimeoutError) as e:
            print(f"Fuente falló ({url}): {e}", file=sys.stderr); last = e
    raise SystemExit(f"No se pudo obtener ninguna fuente. Último error: {last}")

def norm(name, known):
    n = NAME_MAP.get(name, name)
    return n if n in known else None       # None => placeholder (equipo por definir)

def hint(raw):
    """Texto legible para un placeholder de eliminatoria."""
    if not raw:
        return "Por definir"
    if len(raw) >= 2 and raw[0] in "123" and raw[1:].replace("/", "").isalpha():
        pos = {"1": "1°", "2": "2°", "3": "3°"}[raw[0]]
        return f"{pos} Grupo {raw[1:]}"
    if raw[0] == "W" and raw[1:].isdigit():
        return f"Ganador M{raw[1:]}"
    if raw[0] == "L" and raw[1:].isdigit():
        return f"Perdedor M{raw[1:]}"
    return "Por definir"

def normalize(src, known):
    out = []
    for idx, m in enumerate(src["matches"]):
        match_id = idx + 1                 # numeración oficial de partido (orden de la fuente)
        grp = m.get("group", "")
        if grp:
            stage_key, stage = "group", "Grupo " + grp.replace("Group ", "").strip()
            group_letter = grp.replace("Group ", "").strip()
        else:
            stage_key, stage = ROUND_MAP.get(m.get("round", ""), ("ko", "Eliminatoria"))
            group_letter = None
        h_raw, a_raw = m.get("team1", ""), m.get("team2", "")
        h, a = norm(h_raw, known), norm(a_raw, known)
        # raw para el bracket: nombre normalizado si es equipo real, código si no
        home_raw = h if h else h_raw
        away_raw = a if a else a_raw
        score = None
        sc = m.get("score") or {}
        if sc.get("ft") and len(sc["ft"]) == 2:
            score = f"{sc['ft'][0]}-{sc['ft'][1]}"
        if h and a and score:
            status = "jugado"
        elif h and a:
            status = "pendiente"
        else:
            status = "proximo"
        out.append({
            "match_id": match_id,
            "date": m.get("date", ""), "time": m.get("time", ""),
            "home": h, "away": a, "home_raw": home_raw, "away_raw": away_raw,
            "home_hint": hint(h_raw), "away_hint": hint(a_raw),
            "stage": stage, "stage_key": stage_key, "group": group_letter,
            "score": score, "status": status, "ground": m.get("ground", ""),
        })
    out.sort(key=lambda x: (x["date"] or "9999", x["stage_key"]))
    return out

def main():
    teams_db = json.load(open(os.path.join(DATA, "teams.json"), encoding="utf-8"))
    known = set(teams_db["teams"])
    src = fetch()
    matches = normalize(src, known)
    fixtures = {"fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "source": "openfootball/worldcup.json (dominio público)",
                "matches": matches}
    json.dump(fixtures, open(os.path.join(DATA, "fixtures.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    j = sum(1 for m in matches if m["status"] == "jugado")
    p = sum(1 for m in matches if m["status"] == "pendiente")
    x = sum(1 for m in matches if m["status"] == "proximo")
    print(f"Fixtures: {len(matches)} (jugados {j}, pendientes {p}, por definir {x})")

    import model
    model.main()
    print("Predicciones regeneradas.")

if __name__ == "__main__":
    main()
