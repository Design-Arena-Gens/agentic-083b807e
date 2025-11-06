import sharp from "sharp";

export const runtime = "nodejs"; // ensure Node (sharp) on Vercel

function parseBool(v: FormDataEntryValue | null, fallback = false): boolean {
  if (v == null) return fallback;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function parseIntInRange(v: FormDataEntryValue | null, min: number, max: number, fb: number): number {
  const n = v == null ? NaN : Number(v);
  if (!Number.isFinite(n)) return fb;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof File)) {
      return new Response("Mungon fotografia.", { status: 400 });
    }

    const upscale = parseIntInRange(form.get("upscale"), 1, 4, 2);
    const denoise = parseIntInRange(form.get("denoise"), 0, 3, 1);
    const sharpenLevel = parseIntInRange(form.get("sharpen"), 0, 2, 1);
    const autoContrast = parseBool(form.get("autoContrast"), true);
    const colorBoost = parseBool(form.get("colorBoost"), true);

    const arrayBuf = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuf);

    const base = sharp(inputBuffer, { failOn: "none" }).rotate().toColorspace("srgb");
    const meta = await base.metadata();

    // Build pipeline
    let img = sharp(inputBuffer, { failOn: "none" }).rotate().toColorspace("srgb");

    if (autoContrast) {
      img = img.normalize();
    }

    // Gentle dehaze via gamma
    img = img.gamma(0.95);

    if (denoise > 0) {
      img = img.median(denoise); // 1..3
    }

    if (colorBoost) {
      img = img.modulate({ saturation: 1.1, brightness: 1.02 });
    }

    if (sharpenLevel > 0) {
      const sigma = 0.8 * sharpenLevel; // 0.8 or 1.6
      img = img.sharpen(sigma);
    }

    if (meta.width && meta.height && upscale > 1) {
      img = img.resize({
        width: Math.round(meta.width * upscale),
        height: Math.round(meta.height * upscale),
        kernel: sharp.kernel.lanczos3,
        fit: "inside",
        withoutEnlargement: false,
      });
    }

    // Output format: keep png/webp; default to high-quality jpeg
    const mime = (file.type || "").toLowerCase();

    if (mime.includes("png")) {
      const out = await img.png({ compressionLevel: 9, palette: false }).toBuffer();
      const body = new Uint8Array(out);
      return new Response(body, { headers: { "content-type": "image/png" } });
    }

    if (mime.includes("webp")) {
      const out = await img.webp({ quality: 92 }).toBuffer();
      const body = new Uint8Array(out);
      return new Response(body, { headers: { "content-type": "image/webp" } });
    }

    // Default JPEG
    const out = await img.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    const body = new Uint8Array(out);
    return new Response(body, { headers: { "content-type": "image/jpeg" } });
  } catch (err: any) {
    console.error(err);
    return new Response("Gabim gjat? p?rpunimit t? fotos.", { status: 500 });
  }
}
