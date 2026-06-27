# Predicciones Mundial 2026

Modelo estadístico para predicciones del Mundial 2026 (Norteamérica) usando Elo dinámico, Poisson calibrado y Dixon-Coles.

**Sitio en vivo:** https://probcstr.netlify.app (temporal, mira abajo)

## Migración a GitHub Pages (IMPORTANTE)

El sitio está en Netlify pero quema créditos rápidamente (cada actualización de datos = créditos gastados). 

**Para cambiar a GitHub Pages (gratis, sin límites):**

👉 **Lee [GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md)** — son 5 minutos y tu sitio estará en `https://cstr07.github.io/mundial2026/` de forma permanente y sin costo.

## Características

- ⚽ **104 partidos** — grupos + eliminatorias
- 📊 **Paneles interactivos** — partidos, quiniela, precisión, probabilidades, valor
- 🎲 **Creador de parlay** — combina selecciones, calcula momios y retorno
- 🔄 **Actualizaciones automáticas** — GitHub Actions cada 6 horas
- 📈 **Historial verificable** — evolución de la precisión del modelo

## Stack

- **Backend**: Python 3 (Elo + Poisson + Dixon-Coles + Monte Carlo)
- **Frontend**: HTML/CSS/JS vanilla (sin dependencias)
- **Datos**: openfootball/worldcup.json (dominio público)
- **CI/CD**: GitHub Actions (gratuito)
- **Hosting**: GitHub Pages (gratuito) o Netlify

## Archivos principales

```
model.py           # Modelo estadístico
update.py          # Descarga datos y regenera predicciones
.github/workflows/  # GitHub Actions (cada 6 horas)
web/                # Sitio estático (lo que ves)
  index.html
  app.js
  style.css
  data/
    predictions.json
    data.js
```

## Cómo ejecutar localmente

```bash
python3 update.py
# Regenera web/data/predictions.json y web/data/data.js
# Luego abre web/index.html en tu navegador
```

## Licencia

Análisis estadístico con fines informativos. No es consejo de apuestas ni inversión.

---

**Nota**: Para evitar gastar créditos Netlify, **habilita GitHub Pages** (instrucciones arriba).
