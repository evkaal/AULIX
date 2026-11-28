// MaterialesSection — materiales y videos de una clase (Aulix v5).
// - Video por URL (tipo VIDEO del backend): reproductor dentro de la app
//   (<video controls> para mp4/webm, iframe para YouTube/Vimeo).
// - Video subido como archivo (docente): en demo se guarda en memoria
//   (objectURL) y se reproduce con <video>; se puede DESCARGAR.
// - YouTube: se reproduce embebido y tiene botón "Ver en YouTube". YouTube
//   NO permite descargar sus videos, así que NO hay botón de descarga para
//   ellos (no se usa ningún descargador de terceros). La UI lo explica en
//   una línea bajo la lista. Ver LEEME-V5.md.
// - Archivo (tipo ARCHIVO): vista previa si es imagen, botón Descargar
//   (con Bearer en real, objectURL en demo).
// - Subir video por archivo: en modo real el backend lo rechaza (su
//   ArchivoService solo acepta PDF/DOCX/imagen, máx. 20 MB) — la UI avisa
//   antes de enviarlo y sugiere subirlo por URL. En demo sí se guarda el
//   archivo de video en memoria y se reproduce con <video>.
// Se usa en MisClases (detalle) y en ClaseDetalle (/mis-clases/:id).
import { useCallback, useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Play,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import {
  apiDownload,
  apiFetch,
  apiFetchBlob,
  apiFetchForm,
  DEMO_MODE,
} from "../services/authService";
import { isDemo } from "../services/api";

export function youtubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be")
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("vimeo.com"))
      return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
  } catch {
    /* no es URL válida */
  }
  return null;
}

export function isVideoFile(file) {
  return (
    file?.type?.startsWith("video/") ||
    /\.(mp4|webm|mov|mkv)$/i.test(file?.name || "")
  );
}

function VideoPlayer({ material }) {
  const src = material.adjuntoUrl || material.url;
  const embed = youtubeEmbed(src || "");
  if (embed) {
    return (
      <iframe
        className="material-video"
        src={embed}
        title={material.nombre || "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <video className="material-video" controls src={src} preload="metadata" />
  );
}

function MaterialCard({ material, etiqueta }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgError, setImgError] = useState("");
  // El material subido en demo vive en material.adjuntoUrl (data URL
  // persistida, v9; antes era un objectURL en memoria que se perdía al
  // recargar); en real / por URL vive en material.url.
  const src = material.adjuntoUrl || material.url;
  const esVideo =
    material.tipo === "VIDEO" ||
    isVideoFile({ name: material.nombre, type: material.mime });
  const esImagen =
    /\.(png|jpe?g|gif|webp)$/i.test(material.nombre || "") ||
    (material.mime || "").startsWith("image/");
  const esYouTube = !!youtubeEmbed(src || "");
  const nombreGuardado = (material.url || "")
    .replace("/uploads/", "")
    .replace(/^\//, "");

  useEffect(() => {
    // v9: una data URL (demo) ya ES la imagen: se usa directa, sin pedir
    // /archivos (antes caía en 404 y la imagen nunca se veía).
    if (esImagen && src?.startsWith("data:")) {
      setImgUrl(src);
      setImgError("");
      return undefined;
    }
    if (!esImagen || !src || src.startsWith("blob:") || src.startsWith("http"))
      return undefined;
    let alive = true;
    let objectUrl = null;
    apiFetchBlob(`/archivos/${nombreGuardado}`)
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setImgUrl(objectUrl);
      })
      .catch(() => {
        if (alive) setImgError("No se pudo cargar la vista previa.");
      });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [esImagen, src, nombreGuardado]);

  const descargar = async () => {
    // El nombre del material es el título que escribe el docente y muchas
    // veces no trae extensión: Chrome guarda el archivo como .bin.
    // Se le añade la extensión real del archivo guardado.
    const ext = (nombreGuardado.split(".").pop() || "").toLowerCase();
    const base = (material.nombre || "material").replace(/\.+$/, "");
    const nombreDescarga =
      /\.[a-z0-9]+$/i.test(base) || !ext ? base : `${base}.${ext}`;
    try {
      if (
        src?.startsWith("blob:") ||
        src?.startsWith("http") ||
        src?.startsWith("data:")
      ) {
        const a = document.createElement("a");
        a.href = src;
        a.download = nombreDescarga;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      await apiDownload(`/archivos/${nombreGuardado}`, nombreDescarga);
    } catch {
      /* el error se muestra en el botón de abajo si hace falta */
    }
  };

  const abrirVistaPrevia = async () => {
    try {
      if (
        src?.startsWith("data:") ||
        src?.startsWith("blob:") ||
        src?.startsWith("http")
      ) {
        window.open(src, "_blank");
        return;
      }
      const blob = await apiFetchBlob(`/archivos/${nombreGuardado}`);
      // El backend manda octet-stream: se re-etiqueta según la extensión
      // para que el navegador lo muestre en vez de descargarlo.
      const n = (nombreGuardado || material.nombre || "").toLowerCase();
      const mime = /\.pdf$/.test(n)
        ? "application/pdf"
        : /\.png$/.test(n)
          ? "image/png"
          : /\.jpe?g$/.test(n)
            ? "image/jpeg"
            : /\.gif$/.test(n)
              ? "image/gif"
              : /\.webp$/.test(n)
                ? "image/webp"
                : blob.type;
      window.open(
        URL.createObjectURL(new Blob([blob], { type: mime })),
        "_blank",
      );
    } catch {
      /* si falla, el usuario puede usar Descargar */
    }
  };

  return (
    <article className="material-card">
      <div className="material-card__head">
        <span className="material-card__icon">
          {esVideo ? <Play size={16} /> : <FileText size={16} />}
        </span>
        <span className="pg-strong" style={{ fontSize: 14 }}>
          {material.nombre}
        </span>
      </div>
      <span className="pg-sub">
        {material.tipo}
        {material.tamanoBytes
          ? ` · ${Math.round(material.tamanoBytes / 1024)} KB`
          : ""}
        {material.duracionMin ? ` · ${material.duracionMin} min` : ""}
      </span>
      {etiqueta && <span className="pg-badge pg-badge--blue">{etiqueta}</span>}
      {esVideo && src && <VideoPlayer material={material} />}
      {esImagen && imgUrl && (
        <img src={imgUrl} alt={material.nombre} className="material-img" />
      )}
      {esImagen && imgError && <p className="pg-hint">{imgError}</p>}
      <div className="material-card__actions">
        {esYouTube ? (
          <>
            <a
              className="btn btn--ghost btn--sm btn-download"
              href={src}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} /> Ver en YouTube
            </a>
            <span className="pg-hint">
              Los videos de YouTube se reproducen aquí; YouTube no permite
              descargarlos.
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--ghost btn--sm btn-download"
              onClick={descargar}
            >
              <Download size={14} /> Descargar
            </button>
            {src && !src.startsWith("blob:") && (
              <a
                className="btn btn--ghost btn--sm"
                href={src.startsWith("/uploads/") ? undefined : src}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (src.startsWith("/uploads/")) {
                    e.preventDefault();
                    abrirVistaPrevia();
                  }
                }}
              >
                Abrir →
              </a>
            )}
          </>
        )}
      </div>
    </article>
  );
}

const META_KEY = "aulix_material_meta";
// Unidad/Tema en modo REAL: el backend NO tiene esos campos (Recurso solo
// tiene nombre/url/tipo/duracionMin), asi que NO se mandan al backend: se
// guardan solo en este navegador, por id de material. En demo el mock si
// los guarda. Pendiente del companero (ver LEEME-V8.md).
const leerMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}");
  } catch {
    return {};
  }
};

export default function MaterialesSection({
  claseId,
  esDocente,
  claseNombre,
  onError,
}) {
  const [materiales, setMateriales] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("ARCHIVO");
  const [archivo, setArchivo] = useState(null);
  const [url, setUrl] = useState("");
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [tema, setTema] = useState("");
  const [meta, setMeta] = useState(leerMeta);
  const etiqueta = (m) =>
    [m.unidad ?? meta[m.id]?.unidad, m.tema ?? meta[m.id]?.tema, claseNombre]
      .filter(Boolean)
      .join(" · ");
  const [subiendo, setSubiendo] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await apiFetch(`/clases/${claseId}/materiales`);
      setMateriales(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, [claseId]);
  useEffect(() => {
    load();
  }, [load]);

  const subir = async (e) => {
    e.preventDefault();
    setFormError("");
    if (tipo === "ARCHIVO" && !archivo) {
      setFormError("Selecciona un archivo.");
      return;
    }
    if (tipo === "VIDEO" && !url.trim()) {
      setFormError("Escribe la URL del video.");
      return;
    }
    if (archivo && archivo.size > 100 * 1024 * 1024) {
      setFormError(
        "El archivo es muy grande (máx. 100 MB en demo; en modo real el backend acepta 20 MB).",
      );
      return;
    }
    // Video por archivo: el backend real lo rechaza (solo PDF/DOCX/imagen).
    if (
      tipo === "ARCHIVO" &&
      archivo &&
      isVideoFile(archivo) &&
      !isDemo() &&
      !DEMO_MODE
    ) {
      setFormError(
        "El backend aún no acepta subir videos como archivo (solo PDF, DOCX o imagen, máx. 20 MB). Sube el video por URL con el tipo “Video (URL)” o pídele a tu compañero que amplíe los tipos aceptados.",
      );
      return;
    }
    const fd = new FormData();
    if (archivo) fd.append("archivo", archivo);
    fd.append("tipo", tipo);
    fd.append("nombre", nombre.trim() || archivo?.name || "Material");
    if (url.trim()) fd.append("url", url.trim());
    // Unidad/Tema: solo se mandan en demo (el mock los guarda). En real NO
    // se mandan al backend (no tiene esos campos) y se guardan en local.
    const demo = isDemo() || DEMO_MODE;
    if (demo) {
      if (unidad.trim()) fd.append("unidad", unidad.trim());
      if (tema.trim()) fd.append("tema", tema.trim());
    }
    setSubiendo(true);
    try {
      const creado = await apiFetchForm(`/clases/${claseId}/materiales`, fd);
      if (!demo && (unidad.trim() || tema.trim()) && creado?.id) {
        const next = {
          ...leerMeta(),
          [creado.id]: {
            unidad: unidad.trim() || null,
            tema: tema.trim() || null,
          },
        };
        try {
          localStorage.setItem(META_KEY, JSON.stringify(next));
        } catch {
          /* sin storage */
        }
        setMeta(next);
      }
      setNombre("");
      setUrl("");
      setArchivo(null);
      setUnidad("");
      setTema("");
      e.target.reset();
      load();
    } catch (err) {
      setFormError(err.message);
      onError?.(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <section aria-label="Materiales y videos de la clase">
      <div className="section-head">
        <h2>Materiales y videos</h2>
      </div>
      {status === "loading" && (
        <p className="pg-loading">Cargando materiales…</p>
      )}
      {status === "error" && (
        <div className="pg-alert" role="alert">
          <WifiOff size={16} />
          <span>No pudimos cargar los materiales. {error}</span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={load}
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}
      {status === "ready" && materiales.length === 0 && (
        <p className="pg-empty">
          Aún no hay materiales ni videos en esta clase.
          {esDocente ? " Sube el primero con el formulario de abajo." : ""}
        </p>
      )}
      {status === "ready" && materiales.length > 0 && (
        <>
          <div className="materiales-list">
            {materiales.map((m) => (
              <MaterialCard key={m.id} material={m} etiqueta={etiqueta(m)} />
            ))}
          </div>
          {materiales.some((m) =>
            youtubeEmbed(m.adjuntoUrl || m.url || ""),
          ) && (
            <p className="pg-hint">
              Los videos de YouTube se reproducen aquí; YouTube no permite
              descargarlos. La descarga sí funciona con los videos y archivos
              subidos por el docente.
            </p>
          )}
        </>
      )}
      {esDocente && (
        <form className="pg-form" onSubmit={subir} style={{ marginTop: 12 }}>
          <label className="pg-field">
            <span className="pg-label">Tipo de material</span>
            <select
              className="pg-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ARCHIVO">
                Archivo o video subido (PDF, DOCX, imagen o video)
              </option>
              <option value="VIDEO">Video por enlace (YouTube o mp4)</option>
            </select>
          </label>
          {tipo === "ARCHIVO" ? (
            <label className="pg-field">
              <span className="pg-label">Archivo o video</span>
              <input
                className="pg-input"
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp,video/*"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
              <span className="pg-hint">
                Sube un archivo o un video desde tu equipo: el estudiante lo ve
                dentro de la app y puede descargarlo. En modo real el backend
                acepta PDF, DOCX o imagen (máx. 20 MB); los videos por archivo
                solo funcionan en demo, en real usa “Video por enlace”.
              </span>
            </label>
          ) : (
            <label className="pg-field">
              <span className="pg-label">Enlace de YouTube (o video mp4)</span>
              <input
                className="pg-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=… o https://…/video.mp4"
              />
              <span className="pg-hint">
                Pega el enlace de YouTube: se reproduce dentro de la app. Los
                videos de YouTube se reproducen aquí; YouTube no permite
                descargarlos.
              </span>
            </label>
          )}
          <div className="pg-grid">
            <label className="pg-field">
              <span className="pg-label">Unidad</span>
              <input
                className="pg-input"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="Unidad 1"
              />
            </label>
            <label className="pg-field">
              <span className="pg-label">Tema</span>
              <input
                className="pg-input"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ecuaciones"
              />
            </label>
          </div>
          <p className="pg-hint">
            La unidad y el tema se muestran en la tarjeta como &ldquo;Unidad 1 ·
            Ecuaciones · {claseNombre || "esta clase"}&rdquo;. En modo real el
            backend aún no tiene esos campos, así que se guardan solo en este
            navegador.
          </p>
          <label className="pg-field">
            <span className="pg-label">Nombre (opcional)</span>
            <input
              className="pg-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Guía de ecuaciones"
            />
          </label>
          {formError && (
            <p className="pg-error" role="alert">
              {formError}
            </p>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={subiendo}
          >
            {subiendo ? "Subiendo…" : "Subir material"}
          </button>
        </form>
      )}
    </section>
  );
}
