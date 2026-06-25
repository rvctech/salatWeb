import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeB, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, typeB, data, crcVal]);
}

function makePNG(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y++) {
    const off = y * (1 + width * 3);
    raw[off] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 3;
      const di = off + 1 + x * 3;
      raw[di] = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
    }
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x / size) ** 2 + (y / size) ** 2) * 0.7;
      const t = Math.min(dist, 1);
      const r = Math.round(lerp(4, 4, t));
      const g = Math.round(lerp(33, 22, t));
      const b = Math.round(lerp(31, 28, t));
      const off = (y * size + x) * 3;
      pixels[off] = r;
      pixels[off + 1] = g;
      pixels[off + 2] = b;
    }
  }

  const cx = size / 2;
  const cy = size / 2;
  const s = size / 48;

  function drawPath(pts, strokeW) {
    if (pts.length < 2) return;
    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = pts[i][0] * s + cx;
      const y1 = pts[i][1] * s + cy;
      const x2 = pts[i + 1][0] * s + cx;
      const y2 = pts[i + 1][1] * s + cy;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.round(len * 2));
      for (let t = 0; t <= steps; t++) {
        const px = Math.round(x1 + (dx * t) / steps);
        const py = Math.round(y1 + (dy * t) / steps);
        if (px >= 0 && px < size && py >= 0 && py < size) {
          for (let ox = -strokeW; ox <= strokeW; ox++) {
            for (let oy = -strokeW; oy <= strokeW; oy++) {
              if (ox * ox + oy * oy <= strokeW * strokeW) {
                const sx = px + ox;
                const sy = py + oy;
                if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
                  const off = (sy * size + sx) * 3;
                  pixels[off] = 233;
                  pixels[off + 1] = 201;
                  pixels[off + 2] = 127;
                }
              }
            }
          }
        }
      }
    }
  }

  const strokeW = Math.max(1, Math.round(size / 64));
  const paths = [
    [[-12, -21], [-8, -15], [-4, -9], [0, -3], [4, -9], [8, -15], [12, -21]],
    [[-16, 9], [-12, 3], [-8, -1], [-4, -5], [0, -1], [4, -5], [8, -1], [12, 3], [16, 9]],
    [[-20, 15], [-16, 9], [-8, 13], [0, 9], [8, 13], [16, 9], [20, 15]],
  ];

  for (const p of paths) {
    drawPath(p, strokeW);
  }

  return makePNG(size, size, pixels);
}

fs.writeFileSync(path.join(publicDir, "icon-192.png"), generateIcon(192));
fs.writeFileSync(path.join(publicDir, "icon-512.png"), generateIcon(512));
console.log("Icons generated in public/");
