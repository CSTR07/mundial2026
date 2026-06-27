# Predicciones Mundial 2026 ⚽

Aplicación web que predice los partidos del Mundial 2026 (grupos y eliminatorias)
con un modelo estadístico, y **se actualiza sola** todos los días sin intervención.

## Cómo funciona el modelo

- **Fuerza base:** puntos del Ranking FIFA/Coca-Cola oficial (sistema Elo, divisor 600).
- **Estado actual:** esos puntos se actualizan con cada resultado real usando la
  fórmula oficial FIFA `P = P + I·(W − We)` (I = 50 grupos, 60 eliminatoria).
- **Confederación:** ajuste por confederación (CONMEBOL, UEFA, CONCACAF, AFC, CAF, OFC).
- **Goles esperados:** se calibran por máxima verosimilitud (regresión de Poisson)
  sobre los partidos ya jugados del torneo. Los coeficientes salen de los datos.
- **Marcadores:** Dixon-Coles (ρ = −0.08) para obtener 1X2, over/under, ambos anotan
  y los marcadores más probables.
- **Recencia:** los partidos recientes pesan más en la calibración (vida media 14 días),
  igual que el Dixon-Coles original.
- **Calibración por temperatura:** un parámetro (T) ajustado para minimizar la log-loss
  de los partidos jugados, de modo que las probabilidades sean fiables (una predicción
  del 70% acierta ~70% de las veces) sin sobreajustar.
- **Verificación:** el modelo se mide solo, como los servicios profesionales — Brier score,
  log loss, precisión, error de calibración (ECE), skill score vs. baseline y un diagrama
  de fiabilidad, todo visible en la web y guardado en `meta.evaluation`.
- **Simulación Monte Carlo:** el torneo completo se simula 20,000 veces (jugando los partidos
  que faltan, armando el bracket con las reglas FIFA 2026 —mejores 8 terceros incluidos— hasta
  la final) para estimar la probabilidad de cada selección de avanzar de fase, llegar a la final
  y ganar el Mundial. Es la función estrella de los simuladores de pago. Resultado en
  `meta.simulation`. La simulación es **determinista** (mismo dato → mismo resultado), por lo que
  el Action solo publica cuando hay cambios reales.

## Actualización automática (sin depender de nadie)

```
GitHub Action (cada 4 h)
   └─> update.py  →  baja resultados de openfootball/worldcup.json (dominio público)
                  →  normaliza grupos + eliminatorias (maneja equipos "por definir")
                  →  model.py recalibra y regenera predicciones
   └─> git commit + push
Netlify detecta el push  →  redepliega el sitio solo
```

Las eliminatorias (16vos → final) se anticipan en la web como "Próximos" mientras
los equipos no se definen, y se predicen **en automático** en cuanto la fuente
publica los clasificados.

## Puesta en marcha (una sola vez)

1. **Sube este proyecto a un repositorio de GitHub** (público).
2. En **Netlify**: *Add new site → Import an existing project → GitHub* y elige el repo.
   Netlify leerá `netlify.toml` y publicará la carpeta `web/`.
3. En GitHub, pestaña **Settings → Actions → General → Workflow permissions**,
   marca **Read and write permissions** y guarda (para que el bot pueda hacer push).
4. Listo. El Action corre cada 4 horas. Para forzarlo: pestaña **Actions →
   "Actualizar predicciones Mundial 2026" → Run workflow**.

## Estructura

```
web/                     sitio estático (lo que publica Netlify)
  index.html
  app.js                 render de las tarjetas
  style.css              diseño oscuro
  data/
    teams.json           base de selecciones (puntos FIFA, estilo, goleadores) — EDITABLE
    fixtures.json        calendario + resultados en vivo (lo regenera update.py)
    predictions.json     predicciones calculadas (lo regenera model.py)
    data.js              lo que carga la web (lo regenera model.py)
model.py                 motor de predicción
update.py                descarga datos en vivo y dispara el motor
.github/workflows/update.yml   automatización
netlify.toml             config de despliegue
```

## Ajustes manuales

- **Actualizar puntos FIFA:** edita `web/data/teams.json` (campo `fifa_points`) cuando
  FIFA publique un ranking nuevo.
- **Correr en local:** `python update.py` (necesita solo Python 3, sin librerías extra).

## Nota

Los momios mostrados son una **referencia estimada** para comparar contra el modelo,
no momios de una casa real. Las predicciones son probabilidades, no certezas. Este
proyecto es informativo y no constituye consejo de apuestas.
