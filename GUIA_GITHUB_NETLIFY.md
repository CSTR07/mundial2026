# Guía completa: GitHub + Netlify para tu predictor Mundial 2026
**Sin experiencia previa. De cero a en vivo.**

---

## PARTE 1: Crear cuenta de GitHub (5 minutos)

### Paso 1.1: Ir a GitHub
Abre en tu navegador: **https://github.com**

### Paso 1.2: Hacer clic en "Sign up" (arriba a la derecha)

### Paso 1.3: Llenar el formulario
- **Username:** elige algo único (ej: `ppcastro7-mundial` o tu nombre)
- **Email:** tu correo (verifica que recibes un correo de confirmación)
- **Password:** algo seguro (mínimo 15 caracteres)
- Haz clic en "Create account"

### Paso 1.4: Verificar tu email
GitHub te envía un correo. Abre tu correo, entra al enlace de verificación.

### Paso 1.5: Completar el perfil (opcional pero recomendado)
- Nombre: tu nombre real
- Biografía: "Predictor de fútbol + análisis de datos" (o lo que quieras)
- Ubicación: "Mexico" (o la tuya)

✓ **Ya tienes cuenta de GitHub.**

---

## PARTE 2: Preparar los archivos locales (10 minutos)

### Paso 2.1: Descargar el ZIP
Descargar `mundial2026-PRO.zip` desde el correo/archivo que te pasé.

### Paso 2.2: Extraer la carpeta
- Windows: clic derecho → "Extraer todo"
- Mac: doble clic automáticamente extrae
- Linux: `unzip mundial2026-PRO.zip`

Resultado: una carpeta llamada `mundial` (o el nombre que tenga).

### Paso 2.3: Dentro de esa carpeta, verás
```
mundial/
├── .github/
│   └── workflows/
│       └── update.yml          ← El robot que corre cada 4h
├── web/                         ← Tu sitio (HTML, CSS, JS)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── data/
│       ├── teams.json
│       ├── fixtures.json
│       ├── predictions.json
│       └── data.js
├── model.py                     ← Motor (ecuaciones, simulación)
├── update.py                    ← Descargador de datos
├── README.md                    ← Instrucciones
├── netlify.toml                 ← Config de Netlify
└── .gitignore                   ← Archivos a ignorar
```

✓ **Tienes todos los archivos que necesitas.**

---

## PARTE 3: Instalar Git (15 minutos)

Git es el programa que sincroniza tu carpeta local con GitHub.

### Windows:

1. Ve a **https://git-scm.com/download/win**
2. Descarga el instalador (versión 64-bit o 32-bit según tu PC)
3. Abre el `.exe` y sigue el asistente
   - Click en "Next" en todo (las opciones por defecto están bien)
   - Asegúrate de marcar "Git Bash Here" si ves esa opción
4. Al final, click en "Finish"

Para verificar que se instaló:
- Abre **PowerShell** (tecla Windows + escribe "PowerShell")
- Escribe: `git --version`
- Debe mostrar algo como: `git version 2.40.0`

### Mac:

1. Abre **Terminal** (Cmd + Espacio → escribe "Terminal")
2. Copia y pega esto:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
3. Espera a que termine, luego:
```bash
brew install git
```
4. Verifica: `git --version`

### Linux:

```bash
sudo apt update
sudo apt install git
git --version
```

✓ **Git instalado.**

---

## PARTE 4: Crear el repositorio en GitHub y subir tu código (20 minutos)

### Paso 4.1: Crear un repositorio nuevo en GitHub

1. Loguéate en **https://github.com**
2. Arriba a la derecha, click en el **+** (menú desplegable)
3. Click en **"New repository"**
4. Llena el formulario:
   - **Repository name:** `mundial2026` (o el nombre que quieras)
   - **Description:** "Predictor estadístico del Mundial 2026 con Monte Carlo"
   - **Public:** MARCA ESTO (importante para que Netlify pueda leerlo)
   - **Initialize this repository with:** NO MARQUES NADA (dejarlas desmarcadas)
5. Click en **"Create repository"**

Verás una página con instrucciones. NO CIERRES ESTA PÁGINA, la necesitarás.

### Paso 4.2: Abrir terminal en tu carpeta

**Windows (PowerShell):**
1. Abre la carpeta `mundial` en el Explorador
2. Click derecho adentro → "Abrir Terminal PowerShell aquí"

**Mac (Terminal):**
1. Abre Terminal
2. Copia esto (reemplaza `/ruta/` con la ruta real):
```bash
cd /ruta/a/tu/carpeta/mundial
```

**Linux (Terminal):**
Igual que Mac.

### Paso 4.3: Inicializar Git en tu carpeta local

En la terminal, copia y pega uno a uno (presiona Enter después de cada línea):

```bash
git init
```

```bash
git config user.name "Tu Nombre"
```

```bash
git config user.email "tu.correo@ejemplo.com"
```

(Usa el **mismo correo que registraste en GitHub**)

### Paso 4.4: Agregar y hacer commit de los archivos

```bash
git add .
```

```bash
git commit -m "Inicial: predictor Mundial 2026 con calibración y Monte Carlo"
```

### Paso 4.5: Conectar con GitHub y subir

GitHub te mostró una URL que se parece a:
```
https://github.com/TU_USUARIO/mundial2026.git
```

Copia esa URL y pega esto en la terminal (reemplazando la URL):

```bash
git remote add origin https://github.com/TU_USUARIO/mundial2026.git
```

```bash
git branch -M main
```

```bash
git push -u origin main
```

**Importante:** Si te pide usuario/contraseña, debes usar un **Personal Access Token** (no tu contraseña). Ver "Paso 4.6" abajo.

### Paso 4.6: Si pide autenticación (Personal Access Token)

1. Ve a GitHub → tu perfil (arriba a la derecha) → **Settings**
2. Baja a **Developer settings** (abajo a la izquierda)
3. Click en **Personal access tokens** → **Tokens (classic)**
4. Click en **"Generate new token"**
5. Llena:
   - **Note:** "Git push desde mi PC"
   - **Expiration:** "30 days" (o más si quieres)
   - **Select scopes:** Marca **repo** (todas las opciones bajo repo)
6. Click en **"Generate token"**
7. **COPIA el token que aparece** (no lo pierdes, solo se muestra una vez)
8. En la terminal, cuando pida contraseña, **pega el token**

✓ **Tu código está subido a GitHub.**

Verifica: ve a https://github.com/TU_USUARIO/mundial2026 y verás tu carpeta en línea.

---

## PARTE 5: Autorizar permisos del Action (5 minutos)

El Action necesita permiso para hacer push de las predicciones actualizadas.

### Paso 5.1: Ir a Settings del repositorio

1. En tu repo de GitHub (https://github.com/TU_USUARIO/mundial2026)
2. Click en pestaña **Settings**
3. Izquierda → **Actions** → **General**

### Paso 5.2: Configurar permisos

Baja hasta **Workflow permissions**:
- Marca **"Read and write permissions"**
- Click en **Save**

✓ **El Action puede hacer push automáticamente.**

---

## PARTE 6: Conectar Netlify (10 minutos)

Netlify publica tu sitio en línea automáticamente.

### Paso 6.1: Crear cuenta en Netlify

1. Ve a **https://netlify.com**
2. Click en **Sign up** (arriba a la derecha)
3. Click en **"GitHub"** (loguéate con tu cuenta de GitHub)
4. GitHub te pide confirmación → click en **"Authorize netlify"**

### Paso 6.2: Importar tu repositorio

1. En Netlify, click en **"Add new site"** → **"Import an existing project"**
2. Click en **GitHub** (se abre una ventana)
3. Busca y selecciona `mundial2026`
4. Click en **"Install"** o **"Connect"**

### Paso 6.3: Configurar el sitio

Netlify te pregunta:
- **Branch to deploy:** `main` (debe estar seleccionado por defecto)
- **Build command:** Déjalo en blanco (no necesita compilar)
- **Publish directory:** `web` (IMPORTANTE: escribe `web`)

Click en **"Deploy site"**

Espera ~30 segundos. Verás una URL como:
```
https://random-name-12345.netlify.app
```

✓ **Tu sitio está en vivo.**

---

## PARTE 7: Verificar que todo funciona (5 minutos)

### Paso 7.1: Visita tu sitio

1. Abre la URL que Netlify te dio (ej: https://random-name-12345.netlify.app)
2. Deberías ver:
   - Los 104 partidos del Mundial
   - Panel de rendimiento (📊 Rendimiento y calibración)
   - Panel de simulación (🏆 Probabilidades del torneo)
   - Filtros por fase, fecha y estado

### Paso 7.2: Verifica que el Action está configurado

1. En GitHub, ve a tu repo → pestaña **Actions**
2. Deberías ver **"Actualizar predicciones Mundial 2026"**
3. Click y verás el historial

### Paso 7.3: Fuerza una ejecución manual (test)

1. En Actions, selecciona **"Actualizar predicciones Mundial 2026"**
2. Click en **"Run workflow"** → **"Run workflow"** (botón azul)
3. Espera ~1 minuto. Verás un checkmark verde ✓ si funcionó

Si funcionó, tu sitio en Netlify se actualiza automáticamente en ~2 minutos.

✓ **Todo está en vivo y funcionando.**

---

## PARTE 8: De aquí en adelante (automático)

Cada 4 horas:
1. El Action se ejecuta automáticamente
2. Descarga los resultados reales del Mundial
3. Recalcula las predicciones
4. Si hay cambios, hace push a GitHub
5. Netlify lo detecta y redepliega tu sitio

**Tú no tienes que hacer nada.** El mundo ve tu predictor actualizado todos los días.

---

## Solución de problemas

### "Permission denied (publickey)" al hacer push

→ Probable causa: no configuraste bien el Personal Access Token.
→ Solución: repite Paso 4.6.

### El Action corre pero no publica cambios

→ Verificar: Settings → Actions → General → Workflow permissions debe tener "Read and write".

### Netlify no se actualiza

→ Verifica que `netlify.toml` esté en tu repo con `publish = "web"`.
→ Ve a Netlify → Deploy settings → verifica que "Publish directory" sea `web`.

### No veo los gráficos del panel de rendimiento

→ Los gráficos SVG pueden no renderizar en algunos navegadores viejos.
→ Prueba con Chrome, Firefox o Safari recientes.

---

## ¿Preguntas?

Si algo no queda claro, repasa la sección correspondiente o avísame.

**Resumen rápido:**
1. Crea cuenta GitHub
2. Instala Git
3. Sube el código a GitHub (Paso 4)
4. Autoriza permisos (Paso 5)
5. Conecta Netlify (Paso 6)
6. Listo — tu sitio funciona solo de ahora en adelante

