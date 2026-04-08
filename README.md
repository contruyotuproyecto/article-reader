# 📖 Article Reader

> Lector de artículos web sin distracciones — extrae el contenido principal usando el mismo algoritmo que Firefox Reader View.

🔗 **Demo:** [https://article-reader.onrender.com](https://article-reader.onrender.com)

![Python](https://img.shields.io/badge/Backend-Python%20%2B%20FastAPI-blue)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![License](https://img.shields.io/badge/License-MIT-green)

## Características

- **Extracción robusta** con `readability-lxml` (motor de Firefox Reader View)
- **Metadata automática:** autor, sitio, excerpt, imagen OG, tiempo de lectura
- **Controles de lectura:** fuente serif/sans-serif, tamaño de texto ajustable
- **Header persistente:** URL input siempre visible con botón para limpiar
- **Caché backend** (15 min) con límite de 200 entradas
- **Protección SSRF** (bloquea IPs privadas/localhost)
- **Dark mode** automático según preferencias del sistema
- **Responsive** — funciona en desktop, tablet y móvil
- **Historial** de artículos recientes en la sesión

## Arquitectura

```
┌──────────────┐         ┌──────────────────┐         ┌────────────┐
│   Navegador  │  POST   │  FastAPI          │  httpx  │  Sitio web │
│   React App  │────────▶│                  │────────▶│  externo   │
│              │◀────────│  readability-lxml │◀────────│            │
│              │  JSON   │  BeautifulSoup    │  HTML   │            │
│  Vista limpia│         │  Cache en memoria │         │            │
└──────────────┘         └──────────────────┘         └────────────┘
```

## Desarrollo local

### Requisitos

- **Python 3.10+** → [python.org](https://python.org/)
- **Node.js 18+** → [nodejs.org](https://nodejs.org/)

### Instalación

```bash
git clone https://github.com/contruyotuproyecto/article-reader.git
cd article-reader

# Python
pip install -r requirements.txt

# Frontend
cd frontend && npm install && cd ..
```

> **Windows:** Si da error con lxml: `pip install lxml_html_clean`

### Correr (2 terminales)

```bash
# Terminal 1 → Backend
python -m uvicorn server:app --reload --port 8000

# Terminal 2 → Frontend
cd frontend
npm run dev
```

Abrir → **http://localhost:3000**

## API

### `POST /api/fetch`

```json
{ "url": "https://ejemplo.com/articulo" }
```

### `GET /api/health`

```json
{ "status": "ok", "cached_articles": 3 }
```

## Estructura

```
article-reader/
├── server.py           # Backend FastAPI
├── requirements.txt    # Dependencias Python
├── render.yaml         # Deploy config (Render)
├── .gitignore
├── README.md
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        └── App.jsx
```

## Deploy en Render (gratis)

El proyecto incluye `render.yaml` para deploy automático.

1. Subir el repo a GitHub
2. Ir a [render.com](https://render.com) → New → Blueprint
3. Conectar el repo `article-reader`
4. Render detecta el `render.yaml` y crea ambos servicios
5. Esperar ~3 min a que haga build
6. El frontend estará en `https://article-reader.onrender.com`

> **Nota:** El tier gratis de Render duerme el backend después de 15 min sin uso. La primera request tarda ~30s en despertar.

## Tecnologías

| Componente | Tecnología |
|-----------|-----------|
| Backend | Python, FastAPI, httpx, readability-lxml, BeautifulSoup |
| Frontend | React 18, Vite |
| Deploy | Render (Web Service + Static Site) |

## Licencia

MIT — Proyecto educativo y uso personal.
