# Guía expandida y detallada: GitHub + Netlify
**Cada paso explicado visualmente y con ejemplos reales**

---

# PARTE 3: Instalar Git en tu PC (15 minutos)

Git es el programa que controla versiones. Necesitas instalarlo una sola vez en tu PC.

## 3.1 Windows (10 minutos)

### Paso A: Descargar Git

1. Abre tu navegador (Chrome, Firefox, Edge, cualquiera)
2. Ve a: **https://git-scm.com/download/win**
3. Verás una página con opciones. La versión recomendada debería descargarse automáticamente
4. Si no se descarga, haz clic en **"Click here to download manually"**
5. Verás un archivo llamado `Git-2.x.x-64-bit.exe` (el número de versión puede variar)
6. Guarda el archivo en tu carpeta **Descargas**

### Paso B: Instalar Git

1. Abre la carpeta **Descargas** (tecla Windows + D, o Explorador)
2. Busca `Git-2.x.x-64-bit.exe` y **haz doble clic**
3. Verás una ventana de instalación. Click en **"Next"** (siguiente)
4. Verás esto:
   ```
   Select Destination Location
   ```
   Déjalo como está (ruta por defecto: `C:\Program Files\Git`). Click **"Next"**

5. Verás opciones de componentes:
   ```
   Components
   ☑ Git Bash Here
   ☑ Git GUI Here
   ☑ Git LFS (Large File Support)
   ```
   Déjalas como están (todas marcadas está bien). Click **"Next"**

6. Verás:
   ```
   Select Start Menu Folder
   ```
   Déjalo como está. Click **"Next"**

7. Verás:
   ```
   Choose the default editor used by Git
   ```
   Puedes elegir cualquiera. Si no sabes, deja **"Vim"** o **"Nano"**. Click **"Next"**

8. Verás:
   ```
   Adjust your PATH environment
   ☑ Git from the command line and also from 3rd-party software
   ```
   **MARCA ESTA OPCIÓN** (importante para PowerShell). Click **"Next"**

9. Verás opciones de HTTPS. Déjalas como están. Click **"Next"** hasta que llegues a **"Finish"**

10. **La instalación termina.** Click en **"Finish"**

### Paso C: Verificar que Git se instaló

1. Abre **PowerShell** (tecla Windows + R, escribe `powershell`, Enter)
   - O busca: tecla Windows → escribe "PowerShell" → abre la que sale
2. Se abre una ventana negra
3. **Copia y pega esto:**
   ```
   git --version
   ```
4. Presiona **Enter**
5. Deberías ver algo como:
   ```
   git version 2.40.0.windows.1
   ```

✓ **Git instalado correctamente en Windows.**

---

## 3.2 Mac (12 minutos)

### Opción A: Instalar Git con Homebrew (RECOMENDADO)

Homebrew es un "gestor de paquetes" que facilita instalar software en Mac.

#### Paso A1: Instalar Homebrew

1. Abre **Terminal** (Cmd + Espacio, escribe "Terminal", presiona Enter)
2. Se abre una ventana con fondo negro/blanco
3. **Copia exactamente esto:**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
4. **Pegalo en Terminal** (Cmd + V)
5. Presiona **Enter**
6. Te pedirá tu contraseña de Mac. **Escribe tu contraseña** (no verás puntos, eso es normal) y presiona Enter
7. Homebrew empieza a instalarse. Espera ~5 minutos (depende de tu internet)
8. Cuando termine, verás:
   ```
   Installation successful!
   ```

#### Paso A2: Instalar Git con Homebrew

1. En la misma ventana de Terminal, **copia esto:**
   ```bash
   brew install git
   ```
2. **Pegalo** (Cmd + V) y presiona **Enter**
3. Espera ~2 minutos a que instale
4. Cuando termine, verás:
   ```
   Pouring git-2.x.x...
   ```

### Opción B: Instalar Git directamente (si no quieres Homebrew)

1. Ve a **https://git-scm.com/download/mac**
2. Descarga el instalador (`.dmg`)
3. Abre el `.dmg` (haz doble clic)
4. Verás una ventana con un ícono de Git y una carpeta **Applications**
5. **Arrastra** el ícono de Git hacia la carpeta **Applications**
6. Espera a que se copie

### Paso C: Verificar que Git se instaló

1. Abre **Terminal** nuevamente
2. **Copia y pega:**
   ```bash
   git --version
   ```
3. Presiona **Enter**
4. Deberías ver:
   ```
   git version 2.40.0
   ```

✓ **Git instalado correctamente en Mac.**

---

## 3.3 Linux (10 minutos)

### Para Ubuntu/Debian:

1. Abre **Terminal** (Ctrl + Alt + T)
2. **Copia y pega esto:**
   ```bash
   sudo apt update
   ```
3. Presiona **Enter**
4. Te pedirá tu contraseña. **Escribe tu contraseña** y presiona Enter
5. Espera a que termine
6. Ahora **copia y pega:**
   ```bash
   sudo apt install git
   ```
7. Presiona **Enter**
8. Responde **`y`** (sí) cuando te pregunte si deseas continuar
9. Espera a que instale (~2 minutos)

### Para Fedora/RedHat:

1. Abre **Terminal**
2. **Copia y pega:**
   ```bash
   sudo dnf install git
   ```
3. Presiona **Enter**
4. Responde **`y`** cuando pregunte

### Verificar que Git se instaló:

1. En la misma Terminal, **copia y pega:**
   ```bash
   git --version
   ```
2. Presiona **Enter**
3. Deberías ver:
   ```
   git version 2.40.0
   ```

✓ **Git instalado correctamente en Linux.**

---

# PARTE 4: Subir tu código a GitHub (20 minutos)

Aquí es donde sincronizas tu carpeta local con GitHub.

## 4.1 Preparar tu carpeta local

### Paso 1: Extrae el ZIP

1. Descargaste `mundial2026-COMPLETO.zip`
2. **Windows:** clic derecho → "Extraer todo" → elige dónde (ej: Escritorio o Documentos)
3. **Mac:** doble clic (se extrae automáticamente)
4. **Linux:** abre Terminal en la carpeta donde está el ZIP y corre: `unzip mundial2026-COMPLETO.zip`

Resultado: una carpeta llamada `mundial` (o similar)

### Paso 2: Abre Terminal en esa carpeta

#### Windows (PowerShell):
1. Abre el Explorador (tecla Windows + E)
2. Navega a la carpeta `mundial`
3. **Click derecho adentro** (en un espacio vacío)
4. Verás un menú. Click en **"Abrir Terminal PowerShell aquí"** o **"Open PowerShell window here"**
5. Se abre una ventana PowerShell con fondo oscuro

#### Mac (Terminal):
1. Abre Terminal
2. **Copia esto** (reemplaza `/ruta/a/tu/mundial` con la ubicación real):
   ```bash
   cd /ruta/a/tu/mundial
   ```
   Ejemplo: si extrajiste en Descargas:
   ```bash
   cd ~/Downloads/mundial
   ```
3. Presiona **Enter**

#### Linux (Terminal):
Igual que Mac.

---

## 4.2 Configurar Git (primero en tu PC)

Git necesita saber quién eres para hacer cambios. **Haz esto una sola vez.**

En la Terminal/PowerShell que abriste, **copia y pega línea por línea:**

### Línea 1: Configurar nombre
```bash
git config --global user.name "Tu Nombre Completo"
```
**Reemplaza "Tu Nombre Completo"** con tu nombre real (ej: "Jose Moreno Castro")
Presiona **Enter**

### Línea 2: Configurar email
```bash
git config --global user.email "tu.correo@ejemplo.com"
```
**Reemplaza "tu.correo@ejemplo.com"** con el correo que usaste en GitHub
Presiona **Enter**

**Nota:** si quieres usar un nombre diferente solo para este proyecto, omite `--global` en los comandos.

---

## 4.3 Inicializar Git en tu carpeta

En la misma Terminal, **copia y pega:**

```bash
git init
```

Presiona **Enter**

Verás algo como:
```
Initialized empty Git repository in C:\Users\...\mundial\.git
```

---

## 4.4 Agregar todos los archivos

```bash
git add .
```

(el punto `.` significa "todos los archivos de esta carpeta")

Presiona **Enter**

---

## 4.5 Hacer tu primer "commit" (guardar una versión)

```bash
git commit -m "Inicial: predictor Mundial 2026 con calibración y Monte Carlo"
```

Presiona **Enter**

Verás algo como:
```
[main (root-commit) a1b2c3d] Inicial: predictor Mundial 2026 con calibración y Monte Carlo
 12 files changed, 5000 insertions(+)
```

**Esto significa:** Git ha guardado una "foto" de tu proyecto.

---

## 4.6 Crear el repositorio en GitHub

Ahora vas a crear un espacio en GitHub para tu proyecto.

### Paso A: Loguéate en GitHub

1. Abre https://github.com
2. Click en tu perfil (arriba a la derecha)
3. Click en **"Sign in"** si aún no estás logueado

### Paso B: Crear un nuevo repositorio

1. En GitHub, arriba a la derecha, verás un **+** (menú desplegable)
2. Click en el **+**
3. Se abre un menú. Click en **"New repository"**

### Paso C: Llenar el formulario

Verás un formulario con varios campos:

#### Campo 1: Repository name
- Escribe: `mundial2026`
- (o el nombre que prefieras, sin espacios)

#### Campo 2: Description
- Escribe: `Predictor estadístico del Mundial 2026 con Monte Carlo`
- (opcional pero recomendado)

#### Campo 3: Public or Private
- **MARCA "Public"** (importante para que Netlify pueda acceder)
- Un repositorio público significa que cualquiera puede ver el código (es la idea)

#### Campo 4: Initialize this repository with
- **NO MARQUES NADA** aquí
- Queremos un repositorio vacío porque ya tenemos código local

### Paso D: Crear el repositorio

1. Click en el botón azul **"Create repository"**
2. GitHub te mostrará una página con instrucciones
3. **COPIA la URL que aparece en la sección "…or push an existing repository from the command line"**
   - Se verá algo como: `https://github.com/TU_USUARIO/mundial2026.git`
4. **NO CIERRES esta página,** la necesitarás en los próximos pasos

---

## 4.7 Conectar tu carpeta local con GitHub

Vuelve a la Terminal/PowerShell donde tenías tu carpeta.

**Copia y pega esto** (reemplaza la URL con la que copiaste de GitHub):

```bash
git remote add origin https://github.com/TU_USUARIO/mundial2026.git
```

Presiona **Enter**

No verás ningún mensaje (eso es normal).

---

## 4.8 Cambiar nombre de rama (importante para GitHub)

```bash
git branch -M main
```

Presiona **Enter**

---

## 4.9 Subir tu código a GitHub

```bash
git push -u origin main
```

Presiona **Enter**

### Aquí puede pasar una de dos cosas:

#### Caso A: Te pide usuario/contraseña
```
Username for 'https://github.com': 
Password for 'https://github.com/...':
```

**AQUÍ ENTRA LA TRAMPA:** GitHub ya no acepta tu contraseña de usuario. Necesitas un **Personal Access Token** (una contraseña especial temporal).

Sigue los pasos de **Sección 4.10** abajo.

#### Caso B: Se sube sin pedir nada
Si tienes GitHub Desktop instalado o SSH configurado, puede que se suba directamente. Verás:
```
Enumerating objects: 12, done.
Counting objects: 100% (12/12), done.
Delta compression using up to 8 threads
Compressing objects: 100% (10/10), done.
Writing objects: 100% (12/12), 5.00 KiB | 1.25 MiB/s, done.
...
* [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✓ **Tu código está en GitHub.**

---

## 4.10 Crear un Personal Access Token (si lo necesitas)

Si el `git push` te pidió contraseña, haz esto:

### Paso A: Ve a tu perfil de GitHub

1. En GitHub, arriba a la derecha, click en tu **foto de perfil**
2. Se abre un menú. Click en **"Settings"**

### Paso B: Ir a Developer settings

1. A la izquierda, baja hasta encontrar **"Developer settings"** (abajo del todo)
2. Click en **"Developer settings"**

### Paso C: Crear un token

1. A la izquierda, click en **"Personal access tokens"**
2. Click en **"Tokens (classic)"** (la opción más simple)
3. Click en botón **"Generate new token"** (verde)
4. Verás un formulario:

#### Campo: Note
- Escribe: `Git push desde mi PC`

#### Campo: Expiration
- Selecciona **"30 days"** (o "60 days" si prefieres)

#### Campo: Select scopes
- **MARCA "repo"** (importante)
- Esto te dará acceso a tus repositorios
- Las opciones bajo "repo" se marcarán automáticamente

### Paso D: Generar y copiar el token

1. Click en el botón azul **"Generate token"**
2. **APARECERÁ UN CÓDIGO LARGO** (algo como `ghp_1a2b3c4d5e6f7g8h9...`)
3. **CÓPIALO INMEDIATAMENTE** (es la única vez que lo verás)
4. Guárdalo en un lugar seguro (bloc de notas temporal está bien)

### Paso E: Usar el token en Git

Vuelve a la Terminal/PowerShell y **haz el push nuevamente:**

```bash
git push -u origin main
```

Presiona **Enter**

Cuando pida contraseña:
- Username: escribe tu usuario de GitHub
- Password: **PEGA EL TOKEN** (no tu contraseña)

Presiona **Enter**

Verás:
```
* [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✓ **Tu código está en GitHub.**

---

# PARTE 5: Autorizar permisos del Action (5 minutos)

El Action necesita permiso para actualizar tu código automáticamente.

## 5.1 Ir a Settings del repositorio

1. Ve a GitHub: https://github.com/TU_USUARIO/mundial2026
2. Click en la pestaña **"Settings"** (entre "Code" y "Security")

## 5.2 Ir a Actions

1. A la izquierda, busca **"Actions"**
2. Hoveriza sobre "Actions" y verás un submenú
3. Click en **"General"**

## 5.3 Configurar Workflow permissions

Baja en la página hasta encontrar **"Workflow permissions"**

Verás algo como:
```
Workflow permissions
○ Read repository contents and packages only
● Read and write permissions
```

**MARCA "Read and write permissions"** (la segunda opción)

Esto permite que el Action pueda hacer push de los cambios automáticamente.

## 5.4 Guardar

Click en el botón azul **"Save"** (si no se guardó automáticamente)

✓ **Permisos configurados.**

---

# PARTE 6: Conectar Netlify (10 minutos)

Netlify va a publicar tu sitio en internet y actualizarlo automáticamente.

## 6.1 Crear cuenta en Netlify

### Paso A: Ir a Netlify

1. Abre https://netlify.com
2. Arriba a la derecha, click en **"Sign up"**

### Paso B: Loguéate con GitHub

1. Verás opciones: Email, GitHub, GitLab, etc.
2. **Click en "GitHub"**
3. Verás una pantalla que dice: "Authorize netlify by netlify"
4. **Click en "Authorize netlify"**
5. GitHub te pide confirmación
6. **Click en "Authorize"** nuevamente

✓ **Cuenta en Netlify creada (conectada a GitHub).**

---

## 6.2 Importar tu repositorio a Netlify

### Paso A: Crear un nuevo sitio

1. Estás en el dashboard de Netlify
2. Click en botón azul **"Add new site"**
3. Se abre un menú. Click en **"Import an existing project"**

### Paso B: Conectar GitHub

1. Click en **"GitHub"**
2. Netlify abre una ventana pidiendo acceso a tus repos
3. **Click en "Authorize Netlify"**
4. GitHub te pide confirmación
5. **Click en "Authorize"** nuevamente

### Paso C: Buscar tu repositorio

1. Verás una lista de tus repositorios
2. Busca **"mundial2026"** (o el nombre que pusiste)
3. Click en **"mundial2026"**

---

## 6.3 Configurar el sitio

Netlify te muestra una página de configuración:

### Campo: Branch to deploy
- Verás: `main` (eso está correcto)
- Déjalo así

### Campo: Build command
- Verás: vacío (eso está correcto)
- **Déjalo vacío** (tu sitio no necesita compilar)

### Campo: Publish directory
- Verás algo como: vacío o `/public`
- **CAMBIA a: `web`** (IMPORTANTE)
- Tu sitio está en la carpeta `web/`, no en la raíz

### Paso D: Desplegar

1. Cuando todo esté listo, click en botón azul **"Deploy site"**
2. Netlify empieza a desplegar (verás un progreso)
3. Espera ~30-60 segundos
4. Verás una URL como: `https://random-name-12345.netlify.app`

✓ **Tu sitio está en vivo.**

---

## 6.4 Personalizar la URL (opcional)

Netlify te da un nombre aleatorio. Si quieres cambiarlo:

### Paso A: Ir a Site settings

1. En Netlify, estás viendo tu sitio
2. Click en **"Site settings"**

### Paso B: Cambiar el nombre

1. A la izquierda, click en **"General"**
2. En la sección "Site information", verás "Site name"
3. Click en el botón azul **"Change site name"**
4. Escribe el nombre que quieras (ej: `mi-mundial-2026`)
5. Click en **"Save"**

Nueva URL: `https://mi-mundial-2026.netlify.app`

---

# PARTE 7: Verificar que todo funciona (5 minutos)

## 7.1 Visitar tu sitio

1. Copia la URL de Netlify (ej: `https://random-name-12345.netlify.app`)
2. Abrela en tu navegador
3. **Deberías ver:**
   - 104 tarjetas de partidos (3 columnas en escritorio)
   - Filtros: Todas las fases | Grupos | 16vos | 8vos | etc.
   - Panel azul arriba: "62/104 jugados · Ranking FIFA..."
   - Panel desplegable: "📊 Rendimiento y calibración del modelo"
   - Panel desplegable: "🏆 Probabilidades del torneo"
   - Partidos con marcador (los jugados)
   - Partidos sin marcador (los pendientes)
   - Partidos grises (los próximos, por definir)

Si ves todo esto, ✓ **el sitio está funcionando.**

---

## 7.2 Verificar el Action

### Paso A: Ir a GitHub

1. Ve a: https://github.com/TU_USUARIO/mundial2026
2. Click en pestaña **"Actions"**

### Paso B: Ver el historial

Verás un listado de ejecuciones del Action. Cada línea es una corrida automática.

Verás algo como:
```
Actualizar predicciones Mundial 2026
├─ Commit inicial (hace 5 minutos) — ✓ Successful
├─ Actualización automática (hace 30 min) — ✓ Successful
└─ Actualización automática (hace 2h) — ✓ Successful
```

Si ves ✓ (checkmark verde), el Action está funcionando.

---

## 7.3 Forzar una ejecución manual (test)

Quizá quieras verificar que el Action funciona sin esperar 4 horas.

### Paso A: Abre el Action

1. En GitHub, pestaña **"Actions"**
2. Click en **"Actualizar predicciones Mundial 2026"** (en la lista)

### Paso B: Fuerza la ejecución

1. Verás un botón azul **"Run workflow"**
2. Click en él
3. Se abre un desplegable
4. Click en **"Run workflow"** (botón verde)

Espera ~1-2 minutos.

### Paso C: Ver resultado

1. La ejecución aparece en la lista con un ⏳ (en proceso)
2. Cuando termina, ves un ✓ (éxito) o una ✗ (error)
3. Si fue ✓, Netlify detecta el cambio en ~30 segundos y actualiza tu sitio automáticamente

✓ **Todo está funcionando.**

---

# PARTE 8: De aquí en adelante (automático)

**Después de esto, no tienes que hacer nada más.** El sistema funciona solo.

## 8.1 ¿Qué pasa cada 4 horas?

El Action se ejecuta automáticamente:

1. **06:00** → Action descarga datos reales de `openfootball/worldcup.json`
2. → Ejecuta `update.py` y `model.py`
3. → Recalibra el modelo con los nuevos resultados
4. → Corre 20,000 simulaciones Monte Carlo
5. → Si hay cambios, hace un commit y push a GitHub
6. → Netlify detecta el push
7. → Netlify redepliega tu sitio en ~30 segundos
8. **06:02** → Tu sitio en línea está actualizado

Los datos que ves en tu sitio siempre son los más recientes.

## 8.2 ¿Qué pasa si hay un error?

El Action tiene manejo de errores. Si algo falla:

1. GitHub te envía un correo diciendo "Action failed"
2. Puedes ver el error en la pestaña "Actions" de GitHub
3. El problema más común: la fuente `openfootball/worldcup.json` no está disponible
4. Solución: el Action reintentará en 4 horas

## 8.3 ¿Cómo veo el progreso?

1. Ve a GitHub → tu repo → pestaña **"Actions"**
2. Verás un listado con todas las ejecuciones
3. Cada una muestra:
   - Timestamp (cuándo se ejecutó)
   - Status (✓ o ✗)
   - Duración (cuánto tardó)
4. Click en cualquier ejecución para ver logs detallados

## 8.4 ¿Qué pasa si quiero cambiar algo?

Si modificas el código localmente:

```bash
git add .
git commit -m "Cambio: descripción del cambio"
git push
```

GitHub detecta el push → Netlify redepliega automáticamente.

---

# Resumen visual: El flujo completo

```
Tu PC
 ↓ (git push)
GitHub
 ↓ (webhook automático)
Netlify
 ↓ (sirve en internet)
Tu sitio en vivo
 ↑
 └─ cada 4h: Action actualiza datos automáticamente
```

---

# Preguntas frecuentes

### P: ¿Mi código es privado?
R: No. El repositorio es **público** (cualquiera puede ver tu código). Si quieres privado, marca "Private" al crear el repo, pero entonces Netlify puede que tenga limitaciones.

### P: ¿Puedo ver quién visita mi sitio?
R: Netlify gratis tiene analytics básicos. Ve a tu sitio en Netlify → "Analytics".

### P: ¿Qué pasa si Netlify cae?
R: Tu sitio estará offline temporalmente. Puedes tener un dominio personal (netlify.com explica cómo).

### P: ¿Cuánto cuesta?
R: Gratis. Netlify ofrece hosting gratuito para repositorios públicos. GitHub Actions también es gratis para públicos.

### P: ¿Puedo parar el Action?
R: Sí. En GitHub → Settings → Actions → General → "Disable all workflows". Pero luego tendrías que actualizar manualmente.

### P: ¿Puedo ver los logs del Action?
R: Sí. GitHub → Actions → selecciona una ejecución → click en los pasos (Build, Publish, etc.).

---

# Checklista final

- [ ] Git instalado (`git --version` funciona)
- [ ] Cuenta GitHub creada y verificada
- [ ] Código subido a GitHub (`git push` exitoso)
- [ ] Permisos del Action configurados ("Read and write")
- [ ] Netlify conectado al repo
- [ ] Publish directory es `web`
- [ ] Sitio en vivo en Netlify (URL activa)
- [ ] Action ejecutado al menos una vez (✓ en GitHub Actions)
- [ ] Sitio muestra 104 partidos y paneles
- [ ] Puedes abrir/cerrar paneles sin errores

Si todos están marcados: ✓ **¡Listo!**

