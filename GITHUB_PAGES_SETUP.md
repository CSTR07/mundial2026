# Migrar a GitHub Pages (Gratis, sin créditos Netlify)

## Por qué cambiar

- **Netlify**: te gasta créditos cada vez que regenera las predicciones (cada 6 horas = ~40 créditos/semana)
- **GitHub Pages**: **completamente gratis**, sin límites de créditos, y el Action que actualiza los datos sigue siendo gratis en GitHub

## Cómo habilitar GitHub Pages (5 minutos)

### Paso 1: Ve a tu repositorio en GitHub
```
https://github.com/CSTR07/mundial2026
```

### Paso 2: Abre Settings (engranaje, arriba a la derecha)

### Paso 3: En el menú lateral izquierdo, haz scroll hasta encontrar "Pages"

### Paso 4: En "Build and deployment"
- **Source**: selecciona "Deploy from a branch"
- **Branch**: elige "main" / carpeta "/web"
- Dale a guardar

### Paso 5: Espera 1-2 minutos

GitHub Pages empezará a servir tu sitio en:
```
https://cstr07.github.io/mundial2026/
```

## Qué pasa después

1. Tu Action de GitHub sigue corriendo cada 6 horas (gratis)
2. Regenera `web/data/predictions.json` y `web/data/data.js`
3. Los cambios aparecen en vivo en tu URL de GitHub Pages
4. **Cero créditos Netlify gastados**

## Paso opcional: desactivar Netlify

Una vez que GitHub Pages funcione y veas el sitio en vivo, puedes:

1. Ir a [netlify.com](https://netlify.com)
2. Ir a "Team overview" → tu sitio
3. "Site settings" → scroll al fondo → "Delete this site"

Así dejas de usar créditos. Pero no es urgente — si dejas el sitio en Netlify sin renovarlo, simplemente expirará cuando se acaben los créditos.

## Si algo falla

- GitHub Pages tarda 1-2 minutos en servir la primera vez
- Los cambios en el Action aparecen en vivo en 30 segundos (sin rebuild)
- Si ves un error 404, revisa que esté exactamente `/web/` en la configuración

¿Dudas? Avísame.
