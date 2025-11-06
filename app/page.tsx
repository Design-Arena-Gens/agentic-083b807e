"use client";

import { useMemo, useRef, useState } from "react";

type EnhanceOptions = {
  upscale: number;
  denoise: number; // 0-3 (median)
  sharpen: number; // 0-2 (sigma)
  autoContrast: boolean;
  colorBoost: boolean;
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [opts, setOpts] = useState<EnhanceOptions>({
    upscale: 2,
    denoise: 1,
    sharpen: 1,
    autoContrast: true,
    colorBoost: true,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSelectFile = (f: File) => {
    setFile(f);
    setResultUrl(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectFile(e.dataTransfer.files[0]);
    }
  };

  const canEnhance = useMemo(() => !!file && !loading, [file, loading]);

  const handleEnhance = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("upscale", String(opts.upscale));
      form.append("denoise", String(opts.denoise));
      form.append("sharpen", String(opts.sharpen));
      form.append("autoContrast", String(opts.autoContrast));
      form.append("colorBoost", String(opts.colorBoost));

      const res = await fetch("/api/enhance", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "K?rkesa d?shtoi");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err: any) {
      setError(err?.message || "Gabim i panjohur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Foto Enhance</h1>
        <p>P?rmir?so fotografi t? vjetra: past?rti, kontrast, mpreht?si dhe rritje.</p>
      </header>

      <section className="uploader">
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Origjinali" />
          ) : (
            <div className="placeholder">
              <strong>Hidh k?tu</strong> ose kliko p?r t? zgjedhur fotografi
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onSelectFile(f);
            }}
          />
        </div>

        <div className="controls">
          <div className="control">
            <label>Rritja (Upscale)</label>
            <div className="buttons">
              {[1, 2, 4].map((v) => (
                <button
                  key={v}
                  className={opts.upscale === v ? "active" : ""}
                  onClick={() => setOpts((o) => ({ ...o, upscale: v }))}
                >
                  {v}x
                </button>
              ))}
            </div>
          </div>

          <div className="control">
            <label>Zbutja e zhurm?s</label>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={opts.denoise}
              onChange={(e) => setOpts((o) => ({ ...o, denoise: Number(e.target.value) }))}
            />
            <span>{opts.denoise}</span>
          </div>

          <div className="control">
            <label>Mpreht?sia</label>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={opts.sharpen}
              onChange={(e) => setOpts((o) => ({ ...o, sharpen: Number(e.target.value) }))}
            />
            <span>{opts.sharpen}</span>
          </div>

          <div className="toggles">
            <label className="toggle">
              <input
                type="checkbox"
                checked={opts.autoContrast}
                onChange={(e) => setOpts((o) => ({ ...o, autoContrast: e.target.checked }))}
              />
              Auto-kontrast
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={opts.colorBoost}
                onChange={(e) => setOpts((o) => ({ ...o, colorBoost: e.target.checked }))}
              />
              Ngjyr? +
            </label>
          </div>

          <button className="primary" disabled={!canEnhance} onClick={handleEnhance}>
            {loading ? "Duke p?rpunuar..." : "P?rmir?so"}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </section>

      {resultUrl && (
        <section className="result">
          <h2>Rezultati</h2>
          <img src={resultUrl} alt="Rezultati" />
          <a className="secondary" href={resultUrl} download>
            Shkarko imazhin
          </a>
        </section>
      )}

      <footer className="footer">
        <small>? {new Date().getFullYear()} Foto Enhance</small>
      </footer>
    </main>
  );
}
