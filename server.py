"""
Article Reader - Backend (FastAPI + readability-lxml)
Extrae contenido principal de artículos web usando el mismo
algoritmo que Firefox Reader View.
"""

import hashlib
import time
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from readability import Document

app = FastAPI(title="Article Reader API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Cache en memoria (TTL: 15 min) ──────────────────────────
cache: dict[str, dict] = {}
CACHE_TTL = 15 * 60

def get_cached(url: str):
    key = hashlib.md5(url.encode()).hexdigest()
    entry = cache.get(key)
    if entry and (time.time() - entry["time"]) < CACHE_TTL:
        return entry["data"]
    return None

def set_cached(url: str, data: dict):
    key = hashlib.md5(url.encode()).hexdigest()
    cache[key] = {"data": data, "time": time.time()}
    # Limitar tamaño del cache
    if len(cache) > 200:
        oldest = min(cache, key=lambda k: cache[k]["time"])
        del cache[oldest]


# ── Modelos ──────────────────────────────────────────────────
class FetchRequest(BaseModel):
    url: HttpUrl

class ArticleResponse(BaseModel):
    title: str
    content: str
    author: str
    site_name: str
    excerpt: str
    image: str
    word_count: int
    read_time: int
    source_url: str
    cached: bool


# ── SSRF Protection ──────────────────────────────────────────
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "[::1]"}

def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    if hostname in BLOCKED_HOSTS:
        return False
    if hostname.startswith(("192.168.", "10.", "172.16.", "172.17.",
                            "172.18.", "172.19.", "172.2", "172.3")):
        return False
    if hostname.endswith(".local"):
        return False
    return parsed.scheme in ("http", "https")


# ── Extracción de metadata con BeautifulSoup ─────────────────
def extract_metadata(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")

    def meta(prop=None, name=None):
        tag = None
        if prop:
            tag = soup.find("meta", attrs={"property": prop})
        if not tag and name:
            tag = soup.find("meta", attrs={"name": name})
        return tag["content"].strip() if tag and tag.get("content") else ""

    author = (
        meta(name="author")
        or meta(prop="article:author")
        or ""
    )
    # Intentar extraer del HTML si no hay meta
    if not author:
        el = soup.select_one("[class*='author'] a, [class*='author'], [rel='author']")
        if el:
            author = el.get_text(strip=True)

    site_name = meta(prop="og:site_name")
    image = meta(prop="og:image") or meta(name="twitter:image")
    excerpt = meta(prop="og:description") or meta(name="description")

    return {
        "author": author[:200],
        "site_name": site_name[:200],
        "image": image,
        "excerpt": excerpt[:500],
    }


# ── Endpoint principal ───────────────────────────────────────
@app.post("/api/fetch", response_model=ArticleResponse)
async def fetch_article(req: FetchRequest):
    url = str(req.url)

    if not is_safe_url(url):
        raise HTTPException(400, "URL no permitida (red local bloqueada).")

    # Revisar cache
    cached_data = get_cached(url)
    if cached_data:
        return {**cached_data, "cached": True}

    # Fetch con User-Agent estándar de navegador
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=20.0,
            max_redirects=5,
        ) as client:
            resp = await client.get(url, headers=headers)
    except httpx.TimeoutException:
        raise HTTPException(504, "Timeout: el sitio no respondió a tiempo.")
    except httpx.RequestError as e:
        raise HTTPException(502, f"No se pudo conectar con el sitio: {e}")

    if resp.status_code >= 400:
        raise HTTPException(502, f"El sitio respondió con error {resp.status_code}.")

    content_type = resp.headers.get("content-type", "")
    if "text/html" not in content_type and "text/plain" not in content_type:
        raise HTTPException(400, "La URL no devuelve HTML.")

    raw_html = resp.text

    if len(raw_html) < 100:
        raise HTTPException(422, "La página no tiene contenido suficiente.")

    # ── Readability: extraer contenido principal ─────────────
    try:
        doc = Document(raw_html, url=url)
        title = doc.short_title() or doc.title() or "Sin título"
        content_html = doc.summary(html_partial=True)
    except Exception:
        raise HTTPException(
            422, "No se pudo extraer el contenido del artículo."
        )

    # Limpiar el HTML extraído
    soup = BeautifulSoup(content_html, "lxml")

    # Remover scripts/styles residuales
    for tag in soup.find_all(["script", "style", "noscript"]):
        tag.decompose()

    # Hacer imágenes responsivas
    for img in soup.find_all("img"):
        img["loading"] = "lazy"
        if img.get("style"):
            del img["style"]

    clean_html = str(soup)

    # Metadata
    meta = extract_metadata(raw_html)

    # Word count & read time
    text_only = soup.get_text(separator=" ", strip=True)
    words = len(text_only.split())
    read_time = max(1, round(words / 238))

    result = {
        "title": title,
        "content": clean_html,
        "author": meta["author"],
        "site_name": meta["site_name"],
        "image": meta["image"],
        "excerpt": meta["excerpt"],
        "word_count": words,
        "read_time": read_time,
        "source_url": url,
    }

    set_cached(url, result)

    return {**result, "cached": False}


@app.get("/api/health")
def health():
    return {"status": "ok", "cached_articles": len(cache)}

# ── Serve frontend in production ─────────────────────────────
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = Path(__file__).parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
