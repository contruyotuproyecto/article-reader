import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:wght@400;500&display=swap");

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

:root {
  --bg-page: #f0ede6; --bg-card: #ffffff; --bg-muted: #f5f3ee;
  --tx: #1c1917; --tx2: #6b6560; --tx3: #a8a29e;
  --accent: #16803c; --accent-soft: #dcfce7;
  --danger: #b91c1c; --danger-soft: #fee2e2;
  --border: rgba(0,0,0,0.08);
  --r: 10px; --rl: 14px;
  --sans: "IBM Plex Sans", -apple-system, sans-serif;
  --serif: "Source Serif 4", Georgia, serif;
  --mono: "SF Mono", "Fira Code", monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg-page: #111110; --bg-card: #1c1c1a; --bg-muted: #252523;
    --tx: #e7e5e4; --tx2: #a8a29e; --tx3: #6b6560;
    --accent: #4ade80; --accent-soft: #052e16;
    --danger: #f87171; --danger-soft: #450a0a;
    --border: rgba(255,255,255,0.08);
  }
}
body { font-family: var(--sans); background: var(--bg-page); color: var(--tx); -webkit-font-smoothing: antialiased; }
a { color: var(--accent); }

/* ── Header ── */
.top-header {
  position: sticky; top: 0; z-index: 50;
  background: var(--bg-card); border-bottom: 1px solid var(--border);
}
.top-inner {
  max-width: 720px; margin: 0 auto;
  padding: 12px 16px;
  display: flex; flex-direction: column; gap: 8px;
}

/* Desktop: brand + input on same row */
.header-row {
  display: flex; align-items: center; gap: 12px;
}
.brand {
  font-family: var(--serif); font-size: 20px; font-weight: 600;
  letter-spacing: -0.02em; white-space: nowrap; flex-shrink: 0;
}
.input-group {
  display: flex; flex: 1; gap: 8px; align-items: center;
  min-width: 0;
}
.url-input {
  flex: 1; min-width: 0;
  padding: 9px 14px; border-radius: var(--r); font-size: 14px;
  border: 1px solid var(--border); background: var(--bg-muted);
  color: var(--tx); font-family: var(--sans); outline: none;
  transition: border 0.15s;
}
.url-input:focus { border-color: var(--accent); }
.url-input::placeholder { color: var(--tx3); }
.btn-x {
  background: none; border: 1px solid var(--border); color: var(--tx3);
  width: 36px; height: 36px; border-radius: var(--r); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.12s; flex-shrink: 0;
}
.btn-x:hover { background: var(--bg-muted); color: var(--tx); border-color: var(--tx3); }
.btn-go {
  padding: 9px 18px; border-radius: var(--r); border: none;
  background: var(--accent); color: #fff;
  font-size: 14px; font-weight: 500; cursor: pointer;
  font-family: var(--sans); white-space: nowrap;
  transition: all 0.15s; flex-shrink: 0;
}
.btn-go:hover { filter: brightness(1.1); }
.btn-go:disabled { opacity: 0.4; cursor: not-allowed; }

/* Controls bar */
.ctrls {
  display: flex; align-items: center; gap: 2px;
  flex-wrap: wrap;
}
.tb {
  background: none; border: none; cursor: pointer;
  padding: 5px 10px; border-radius: var(--r);
  color: var(--tx2); display: flex; align-items: center;
  justify-content: center; text-decoration: none;
  font-size: 14px; transition: all 0.12s; flex-shrink: 0;
}
.tb:hover { background: var(--bg-muted); color: var(--tx); }
.tb.on { color: var(--accent); background: var(--accent-soft); }
.sep { width: 1px; height: 16px; background: var(--border); margin: 0 6px; flex-shrink: 0; }
.meta-sm { font-size: 12px; color: var(--tx3); white-space: nowrap; }
.spacer { flex: 1; min-width: 8px; }

/* ── Mobile: stack everything ── */
@media (max-width: 640px) {
  .top-inner { padding: 10px 12px; gap: 8px; }
  .header-row { flex-wrap: wrap; gap: 8px; }
  .brand { width: 100%; font-size: 18px; }
  .input-group { width: 100%; }
  .url-input { font-size: 16px; padding: 10px 12px; }
  .btn-go { padding: 10px 16px; }
  .ctrls { gap: 0; }
  .ctrls .meta-sm { display: none; }
  .tb { padding: 6px 8px; font-size: 13px; }
  .sep { margin: 0 4px; }
}

/* ── Content ── */
.shell {
  max-width: 680px; margin: 0 auto;
  padding: 1.5rem 16px 3rem;
}
@media (max-width: 640px) {
  .shell { padding: 1rem 12px 2rem; }
}

.error-box {
  margin-top: 14px; padding: 12px 16px; border-radius: var(--r);
  background: var(--danger-soft); color: var(--danger); font-size: 14px;
}
.loader {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 3rem 0;
}
.spinner {
  width: 28px; height: 28px; border: 3px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loader-text { font-size: 14px; color: var(--tx3); }

.welcome { text-align: center; padding: 3rem 0 1.5rem; }
.welcome h2 {
  font-family: var(--serif); font-size: 32px; font-weight: 600;
  letter-spacing: -0.02em;
}
.welcome p { color: var(--tx2); font-size: 15px; margin-top: 6px; }
@media (max-width: 640px) {
  .welcome { padding: 2rem 0 1rem; }
  .welcome h2 { font-size: 26px; }
  .welcome p { font-size: 14px; }
}

.info-box {
  margin-top: 24px; padding: 20px; border-radius: var(--rl);
  background: var(--bg-muted); font-size: 14px;
  color: var(--tx2); line-height: 1.65;
}
.info-box strong { color: var(--tx); font-weight: 500; }
@media (max-width: 640px) {
  .info-box { padding: 16px; font-size: 13px; }
}

/* ── Article ── */
.meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 11px; border-radius: 999px;
  font-size: 13px; color: var(--tx2); background: var(--bg-muted);
}
.hero-img {
  width: 100%; border-radius: var(--rl);
  margin-bottom: 24px; max-height: 400px; object-fit: cover;
}
@media (max-width: 640px) {
  .hero-img { border-radius: var(--r); margin-bottom: 16px; max-height: 240px; }
}

.article-title {
  font-size: 30px; font-weight: 600; line-height: 1.22;
  font-family: var(--serif); margin-bottom: 14px;
}
@media (max-width: 640px) {
  .article-title { font-size: 24px; line-height: 1.28; }
}

.article-excerpt {
  font-size: 16px; color: var(--tx2); line-height: 1.5;
  margin-bottom: 18px; font-style: italic;
}
@media (max-width: 640px) {
  .article-excerpt { font-size: 15px; }
}

/* Reader body */
.reader-body { line-height: 1.9; color: var(--tx); overflow-wrap: break-word; word-break: break-word; }
.reader-body p { margin: 0 0 1.35em; }
.reader-body h1,.reader-body h2,.reader-body h3,.reader-body h4 {
  font-family: var(--sans); font-weight: 500;
  margin: 1.6em 0 0.5em; line-height: 1.3;
}
.reader-body h2 { font-size: 1.35em; }
.reader-body h3 { font-size: 1.15em; }
.reader-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
.reader-body a { color: var(--accent); text-underline-offset: 2px; }
.reader-body blockquote {
  border-left: 3px solid var(--accent); padding-left: 1.2em;
  margin: 1.4em 0; color: var(--tx2); font-style: italic;
}
.reader-body ul,.reader-body ol { padding-left: 1.5em; margin: 0.8em 0 1.3em; }
.reader-body li { margin: 0.25em 0; }
.reader-body figure { margin: 1.4em 0; }
.reader-body figcaption {
  font-size: 0.85em; color: var(--tx3);
  margin-top: 0.4em; text-align: center;
}
.reader-body pre {
  background: var(--bg-muted); padding: 1em; border-radius: 8px;
  overflow-x: auto; font-size: 0.85em; font-family: var(--mono);
}
.reader-body code { font-family: var(--mono); font-size: 0.88em; }
.reader-body table {
  width: 100%; border-collapse: collapse;
  margin: 1em 0; font-size: 0.9em;
  display: block; overflow-x: auto;
}
.reader-body th,.reader-body td {
  padding: 8px 12px; border-bottom: 1px solid var(--border);
  text-align: left; white-space: nowrap;
}
@media (max-width: 640px) {
  .reader-body { line-height: 1.8; }
  .reader-body blockquote { padding-left: 1em; margin: 1em 0; }
  .reader-body pre { padding: 0.8em; font-size: 0.8em; }
}

.reader-footer {
  border-top: 1px solid var(--border);
  margin-top: 48px; padding-top: 20px; text-align: center;
}

.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

/* History */
.hist { margin-top: 20px; }
.hist-label {
  font-size: 11px; color: var(--tx3);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
}
.hist-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: var(--r);
  cursor: pointer; transition: background 0.12s;
}
.hist-item:hover { background: var(--bg-muted); }
.hist-title {
  font-size: 14px; color: var(--tx);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hist-url {
  font-size: 12px; color: var(--tx3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
@media (max-width: 640px) {
  .hist-item { padding: 8px 8px; gap: 8px; }
  .hist-title { font-size: 13px; }
}
`;

/* ── Icons ── */
const ClockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

/* ── Reader content ── */
function ReaderContent({ html }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;
    ref.current.querySelectorAll("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [html]);
  return <div ref={ref} className="reader-body" />;
}

/* ── App ── */
export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [article, setArticle] = useState(null);
  const [fontSize, setFontSize] = useState(19);
  const [serif, setSerif] = useState(true);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const fetchArticle = async (targetUrl) => {
    const trimmed = (targetUrl || url).trim();
    if (!trimmed) return;
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
    try { new URL(finalUrl); } catch { setError("URL no válida."); return; }

    setLoading(true);
    setError("");
    setArticle(null);

    try {
      const resp = await fetch(`${API_BASE}/api/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || `Error ${resp.status}`);
      setArticle(data);
      setHistory((prev) => {
        const next = [
          { url: finalUrl, title: data.title, time: Date.now() },
          ...prev.filter((h) => h.url !== finalUrl),
        ];
        return next.slice(0, 12);
      });
    } catch (err) {
      setError(err.message || "Error al obtener el artículo.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setUrl("");
    setArticle(null);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  return (
    <>
      <style>{CSS}</style>

      {/* ── Sticky header ── */}
      <div className="top-header">
        <div className="top-inner">
          <div className="header-row">
            <div className="brand">Article Reader</div>
            <div className="input-group">
              <input
                ref={inputRef}
                className="url-input"
                placeholder="Pega una URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchArticle()}
                autoFocus
              />
              {url && (
                <button className="btn-x" onClick={clearAll} title="Limpiar URL">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
              <button className="btn-go" onClick={() => fetchArticle()} disabled={loading || !url.trim()}>
                {loading ? "..." : "Leer"}
              </button>
            </div>
          </div>

          {article && (
            <div className="ctrls">
              <button className={`tb ${serif ? "on" : ""}`} onClick={() => setSerif(true)} style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>Serif</button>
              <button className={`tb ${!serif ? "on" : ""}`} onClick={() => setSerif(false)} style={{ fontFamily: "var(--sans)", fontWeight: 500 }}>Sans</button>
              <div className="sep" />
              <button className="tb" onClick={() => setFontSize((s) => Math.max(14, s - 2))} style={{ fontSize: 13 }}>A−</button>
              <button className="tb" onClick={() => setFontSize((s) => Math.min(26, s + 2))} style={{ fontSize: 16 }}>A+</button>
              <div className="spacer" />
              <span className="meta-sm">{article.word_count.toLocaleString()} palabras · {article.read_time} min</span>
              <div className="sep" />
              <a className="tb" href={article.source_url} target="_blank" rel="noopener noreferrer" title="Ver original">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="shell">
        {error && <div className="error-box">{error}</div>}

        {loading && (
          <div className="loader">
            <div className="spinner" />
            <div className="loader-text">Extrayendo artículo...</div>
          </div>
        )}

        {!article && !loading && (
          <div className="fade-in">
            <div className="welcome">
              <h2>Lee sin distracciones</h2>
              <p>Pega la URL de cualquier artículo arriba y presiona Leer</p>
            </div>

            {history.length > 0 && (
              <div className="hist">
                <div className="hist-label">Recientes</div>
                {history.map((h) => (
                  <div key={h.url} className="hist-item" onClick={() => { setUrl(h.url); fetchArticle(h.url); }}>
                    <ClockIcon size={15} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="hist-title">{h.title}</div>
                      <div className="hist-url">{h.url}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

  <div className="info-box">
  <strong>¿Cómo funciona?</strong>
  <p style={{ marginTop: 8 }}>
    • Pega la URL de un artículo.<br />
    • Obtén una versión limpia y fácil de leer.<br />
    • Elimina publicidad, popups, menús y distracciones.<br />
    • Muestra solo el contenido principal y oculto.
  </p>
</div>
          </div>
        )}

        {article && !loading && (
          <div className="fade-in">
            {article.site_name && (
              <div style={{ fontSize: 12, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                {article.site_name}
              </div>
            )}

            <h1 className="article-title">{article.title}</h1>

            {article.excerpt && (
              <p className="article-excerpt">{article.excerpt}</p>
            )}

            <div className="meta-row">
              {article.author && <span className="pill">{article.author}</span>}
              <span className="pill"><ClockIcon /> {article.read_time} min</span>
              <span className="pill">{article.word_count.toLocaleString()} palabras</span>
            </div>

            {article.image && (
              <img src={article.image} alt="" className="hero-img" onError={(e) => (e.target.style.display = "none")} />
            )}

            <div style={{ fontFamily: serif ? "var(--serif)" : "var(--sans)", fontSize: `${fontSize}px` }}>
              <ReaderContent html={article.content} />
            </div>

            <div className="reader-footer">
              <button className="tb" onClick={clearAll} style={{ display: "inline-flex", gap: 6, fontSize: 14, color: "var(--tx2)", padding: "8px 16px" }}>
                Leer otro artículo
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
