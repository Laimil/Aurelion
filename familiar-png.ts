// Фамільяр картинкою для бота: той самий familiar.js, що на сайті, без браузера.
// pixels() дає 48×48 RGBA → тут збільшуємо (найближчий сусід) і пакуємо в PNG.
// ⚠ У Supabase familiar.js і цей файл мають лежати поряд із telegram-webhook.ts.
import "./familiar.js";

const F = (globalThis as any).AuFamiliar;

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

async function zlib(raw: Uint8Array): Promise<Uint8Array> {
  const s = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

const BG = [26, 26, 26];

// look — як у familiars.look; stage/state — з familiar_info; scale — у скільки разів збільшити.
export async function familiarPng(look: unknown, stage = 3, state = "awake", scale = 10): Promise<Uint8Array | null> {
  if (!F?.pixels) { console.warn("фамільяр: familiar.js не підвантажився"); return null; }
  const o = F.frame(look, { stage, state }, 1, {});
  o.bob = 0; o.tick = 1;
  const px: Uint8ClampedArray = F.pixels(o);
  const N = 48, pad = 4, S = (N + pad * 2) * scale;
  const raw = new Uint8Array(S * (S * 3 + 1));
  for (let y = 0; y < S; y++) {
    const row = y * (S * 3 + 1);
    raw[row] = 0;
    const sy = Math.floor(y / scale) - pad;
    for (let x = 0; x < S; x++) {
      const sx = Math.floor(x / scale) - pad, o3 = row + 1 + x * 3;
      let c = BG;
      if (sx >= 0 && sy >= 0 && sx < N && sy < N) {
        const i = (sy * N + sx) * 4;
        if (px[i + 3]) c = [px[i], px[i + 1], px[i + 2]];
      }
      raw[o3] = c[0]; raw[o3 + 1] = c[1]; raw[o3 + 2] = c[2];
    }
  }
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, S); dv.setUint32(4, S);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", await zlib(raw)), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0; for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
