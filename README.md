# Predicciones Mundial 2026

Modelo estadístico para predicciones del Mundial 2026 (Norteamérica) usando Elo dinámico, Poisson calibrado y Dixon-Coles.

**Sitio en vivo:** https://cstr07.github.io/mundial2026/

## Hosting

El sitio se publica con **GitHub Pages** de forma gratuita y sin límites de créditos. El despliegue es automático mediante GitHub Actions: cada vez que se regeneran las predicciones o se actualiza la carpeta `web/`, el sitio se vuelve a desplegar solo.

Para habilitarlo (una sola vez): en el repositorio, ve a **Settings -> Pages -> Build and deployment -> Source** y selecciona **"GitHub Actions"**. El workflow `deploy.yml` se encarga del resto.

## Caracteristicas

- **104 partidos** — grupos + eliminatorias
- **Paneles interactivos** — partidos, quiniela, precision, probabilidades, valor
- **Creador de parlay** — combina selecciones, calcula momios y retorno
- **Actualizaciones automaticas** — GitHub Actions cada 6 horas
- **Historial verificable** — evolucion de la precision del modelo

## Stack

- **Backend**: Python 3 (Elo + Poisson + Dixon-Coles + Monte Carlo)
- **Frontend**: HTML/CSS/JS vanilla (sin dependencias)
- **Datos**: openfootball/worldcup.json (dominio publico)
- **CI/CD**: GitHub Actions (gratuito)
- **Hosting**: GitHub Pages (gratuito)

## Archivos principales

```
model.py            # Modelo estadistico
update.py           # Descarga datos y regenera predicciones
.github/workflows/
  update.yml        # Regenera predicciones cada 6 horas
  deploy.yml        # Despliega a GitHub Pages
web/                # Sitio estatico (lo que ves)
  index.html
  app.js
  style.css
  data/
    predictions.json
    data.js
```

## Como ejecutar localmente

```bash
python3 update.py
# Regenera web/data/predictions.json y web/data/data.js
# Luego abre web/index.html en tu navegador
```

## Licencia

Analisis estadistico con fines informativos. No es consejo de apuestas ni inversion.
