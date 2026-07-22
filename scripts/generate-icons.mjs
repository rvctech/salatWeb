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

// --- Drawing primitives ---

function setPixel(pixels, size, x, y, r, g, b) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const off = (y * size + x) * 3;
  pixels[off] = r;
  pixels[off + 1] = g;
  pixels[off + 2] = b;
}

function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

function drawThickLine(pixels, size, x0, y0, x1, y1, radius, color) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const steps = Math.max(1, Math.round(len * 3));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    for (let ox = -radius; ox <= radius; ox++) {
      for (let oy = -radius; oy <= radius; oy++) {
        if (ox * ox + oy * oy <= radius * radius) {
          setPixel(pixels, size, px + ox, py + oy, ...color);
        }
      }
    }
  }
}

function drawFilledEllipse(pixels, size, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        setPixel(pixels, size, x, y, ...color);
      }
    }
  }
}

function drawFilledRect(pixels, size, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      setPixel(pixels, size, x, y, ...color);
    }
  }
}

function drawDome(pixels, size, cx, baseY, width, height, color) {
  const a = width / 2;
  const b = height;
  for (let dy = 0; dy <= height; dy++) {
    const t = dy / height;
    const halfW = a * Math.sqrt(Math.max(0, 1 - t * t));
    for (let dx = -Math.ceil(halfW); dx <= Math.ceil(halfW); dx++) {
      setPixel(pixels, size, cx + dx, baseY - dy, ...color);
    }
  }
}

function drawCrescent(pixels, size, cx, cy, outerR, innerR, offsetX, color) {
  for (let y = -outerR; y <= outerR; y++) {
    for (let x = -outerR; x <= outerR; x++) {
      const dOuter = x * x + y * y;
      const dInner = (x - offsetX) * (x - offsetX) + y * y;
      if (dOuter <= outerR * outerR && dInner > innerR * innerR) {
        setPixel(pixels, size, cx + x, cy + y, ...color);
      }
    }
  }
}

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 3);

  const GOLD = [233, 201, 127];
  const GOLD_LIGHT = [243, 226, 182];
  const GOLD_DARK = [180, 150, 70];
  const BG_DARK = [4, 22, 28];
  const BG_MID = [6, 43, 40];
  const BG_LIGHT = [29, 138, 130];
  const DOOR = [4, 22, 28];

  const s = size / 512;

  // Background gradient (diagonal)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = Math.min(1, Math.sqrt((x / size) ** 2 + (y / size) ** 2) * 0.8);
      const c = lerpColor(BG_MID, BG_DARK, t);
      setPixel(pixels, size, x, y, ...c);
    }
  }

  // Radial glow behind dome
  const glowCx = size * 0.5;
  const glowCy = size * 0.42;
  const glowR = size * 0.42;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - glowCx;
      const dy = y - glowCy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < glowR) {
        const t = 1 - dist / glowR;
        const a = t * t * 0.25;
        const off = (y * size + x) * 3;
        pixels[off] = Math.round(pixels[off] * (1 - a) + BG_LIGHT[0] * a);
        pixels[off + 1] = Math.round(pixels[off + 1] * (1 - a) + BG_LIGHT[1] * a);
        pixels[off + 2] = Math.round(pixels[off + 2] * (1 - a) + BG_LIGHT[2] * a);
      }
    }
  }

  // Geometric pattern (very subtle)
  const patAlpha = 0.04;
  for (let r = 0; r < 3; r++) {
    const radius = [180, 140, 100][r] * s;
    for (let angle = 0; angle < 360; angle += 1) {
      const rad = (angle * Math.PI) / 180;
      const px = Math.round(glowCx + Math.cos(rad) * radius);
      const py = Math.round(glowCy + Math.sin(rad) * radius);
      setPixel(pixels, size, px, py,
        Math.round(GOLD[0] * patAlpha),
        Math.round(GOLD[1] * patAlpha),
        Math.round(GOLD[2] * patAlpha)
      );
    }
  }

  // Ground / base platform
  const baseY = Math.round(390 * s);
  const baseTop = Math.round(370 * s);
  const baseLeft = Math.round(110 * s);
  const baseRight = Math.round(402 * s);
  drawFilledRect(pixels, size, baseLeft, baseTop, baseRight, baseY, GOLD_DARK);

  // Base highlight line
  drawFilledRect(pixels, size, baseLeft, baseTop, baseRight, baseTop + 1, GOLD);

  // Main dome
  const domeCx = Math.round(256 * s);
  const domeBaseY = Math.round(340 * s);
  const domeW = Math.round(216 * s);
  const domeH = Math.round(180 * s);
  drawDome(pixels, size, domeCx, domeBaseY, domeW, domeH, GOLD);

  // Dome highlight (left side, lighter)
  const domeHLW = Math.round(100 * s);
  const domeHLH = Math.round(140 * s);
  for (let dy = 0; dy <= domeHLH; dy++) {
    const t = dy / domeHLH;
    const halfW = domeHLW * Math.sqrt(Math.max(0, 1 - t * t));
    for (let dx = -Math.ceil(halfW); dx <= Math.ceil(halfW) * 0.3; dx++) {
      const px = domeCx - Math.round(30 * s) + dx;
      const py = domeBaseY - dy;
      if (px >= 0 && px < size && py >= 0 && py < size) {
        const off = (py * size + px) * 3;
        const blend = 0.15 * (1 - t);
        pixels[off] = Math.round(pixels[off] * (1 - blend) + GOLD_LIGHT[0] * blend);
        pixels[off + 1] = Math.round(pixels[off + 1] * (1 - blend) + GOLD_LIGHT[1] * blend);
        pixels[off + 2] = Math.round(pixels[off + 2] * (1 - blend) + GOLD_LIGHT[2] * blend);
      }
    }
  }

  // Door arch
  const doorCx = domeCx;
  const doorBaseY = baseY;
  const doorW = Math.round(52 * s);
  const doorH = Math.round(50 * s);
  const doorTopY = doorBaseY - doorH;
  drawFilledRect(pixels, size, doorCx - doorW / 2, doorTopY + doorW / 2, doorCx + doorW / 2, doorBaseY, DOOR);
  // Arch top
  drawDome(pixels, size, doorCx, doorTopY + doorW / 2, doorW, doorW / 2, DOOR);

  // Left minaret
  const minaretW = Math.round(28 * s);
  const minaretH = Math.round(130 * s);
  const minaretTop = Math.round(260 * s);
  const minaretLeft = Math.round(112 * s);
  drawFilledRect(pixels, size, minaretLeft, minaretTop, minaretLeft + minaretW, minaretTop + minaretH, GOLD_DARK);

  // Left minaret dome
  drawDome(pixels, size, minaretLeft + minaretW / 2, minaretTop, minaretW, Math.round(20 * s), GOLD);

  // Left minaret balcony
  drawFilledRect(pixels, size, minaretLeft - Math.round(4 * s), minaretTop + Math.round(30 * s),
    minaretLeft + minaretW + Math.round(4 * s), minaretTop + Math.round(35 * s), GOLD_DARK);

  // Left minaret crescent
  const lcCx = minaretLeft + minaretW / 2;
  const lcCy = minaretTop - Math.round(16 * s);
  drawThickLine(pixels, size, lcCx, minaretTop - Math.round(8 * s), lcCx, lcCy + Math.round(4 * s), Math.max(1, Math.round(1.5 * s)), GOLD);
  drawCrescent(pixels, size, lcCx, lcCy, Math.round(5 * s), Math.round(4 * s), Math.round(1.5 * s), GOLD);

  // Right minaret (mirror)
  const rMinaretLeft = Math.round(372 * s);
  drawFilledRect(pixels, size, rMinaretLeft, minaretTop, rMinaretLeft + minaretW, minaretTop + minaretH, GOLD_DARK);
  drawDome(pixels, size, rMinaretLeft + minaretW / 2, minaretTop, minaretW, Math.round(20 * s), GOLD);
  drawFilledRect(pixels, size, rMinaretLeft - Math.round(4 * s), minaretTop + Math.round(30 * s),
    rMinaretLeft + minaretW + Math.round(4 * s), minaretTop + Math.round(35 * s), GOLD_DARK);

  const rcCx = rMinaretLeft + minaretW / 2;
  drawThickLine(pixels, size, rcCx, minaretTop - Math.round(8 * s), rcCx, lcCy + Math.round(4 * s), Math.max(1, Math.round(1.5 * s)), GOLD);
  drawCrescent(pixels, size, rcCx, lcCy, Math.round(5 * s), Math.round(4 * s), Math.round(1.5 * s), GOLD);

  // Main dome crescent finial
  const finialCx = domeCx;
  const finialBaseY = domeBaseY - domeH;
  drawThickLine(pixels, size, finialCx, finialBaseY + Math.round(12 * s), finialCx, finialBaseY - Math.round(8 * s), Math.max(1, Math.round(2 * s)), GOLD);
  drawCrescent(pixels, size, finialCx, finialBaseY - Math.round(16 * s), Math.round(9 * s), Math.round(7 * s), Math.round(2.5 * s), GOLD);

  // Stars
  const starPositions = [
    [100, 110, 1.5], [420, 90, 1], [80, 180, 1], [440, 170, 1.5],
    [160, 80, 1], [360, 70, 1.2], [60, 140, 0.8], [450, 130, 0.8],
  ];
  for (const [sx, sy, sr] of starPositions) {
    drawFilledEllipse(pixels, size, sx * s, sy * s, sr * s, sr * s, GOLD);
  }

  return makePNG(size, size, pixels);
}

fs.writeFileSync(path.join(publicDir, "icon-192.png"), generateIcon(192));
fs.writeFileSync(path.join(publicDir, "icon-512.png"), generateIcon(512));
console.log("Icons generated in public/");
