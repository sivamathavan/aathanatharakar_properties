"use client";
// Poster, visiting card and brochure, drawn on a canvas in the browser.
// The browser shapes Tamil text correctly (server image renderers don't), and
// photos come through /api/agent/media so the canvas can be saved.
import QRCode from "qrcode";
import { brandPreset } from "@/lib/agent-brand";

export interface KitAgent {
  displayName: string;
  agencyName?: string | null;
  tagline?: string | null;
  phone: string; // digits with country code, e.g. 919876543210
  city: string;
  officeAddress?: string | null;
  reraNumber?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export interface KitListing {
  title: string;
  priceText: string;
  kindText: string;
  areaText: string;
  place: string;
  description: string;
  amenities: string[];
  facts: { label: string; value: string }[];
  photos: string[];
  url: string;
}

/** Words printed on the poster, card and brochure, in the agent's chosen language. */
export interface KitLabels {
  scanTitle: string; // "Scan to see my properties"
  scanHint: string; // "Point your phone camera at the code"
  cardScan: string; // "Scan for all my properties"
  online: string; // "See photos and enquire online"
  amenities: string; // "Amenities"
}

const proxied = (url: string) => `/api/agent/media?src=${encodeURIComponent(url)}`;

export function loadImage(src: string | null | undefined, viaProxy = true): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = viaProxy && /^https?:\/\//.test(src) ? proxied(src) : src;
  });
}

async function qrImage(url: string, size: number): Promise<HTMLImageElement | null> {
  const data = await QRCode.toDataURL(url, { margin: 1, width: size, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#FFFFFF" } });
  return loadImage(data, false);
}

/** Font stacks from the page (next/font), with the Tamil font as fallback for Tamil letters. */
export async function kitFonts() {
  const css = getComputedStyle(document.documentElement);
  const sans = css.getPropertyValue("--font-sans").trim() || "sans-serif";
  const display = css.getPropertyValue("--font-display").trim() || "serif";
  const tamil = css.getPropertyValue("--font-tamil").trim() || "sans-serif";
  await Promise.all([
    document.fonts.load(`700 40px ${sans}`),
    document.fonts.load(`700 40px ${display}`),
    document.fonts.load(`700 40px ${tamil}`, "தமிழ்"),
    document.fonts.load(`400 40px ${tamil}`, "தமிழ்"),
  ]).catch(() => {});
  return {
    sans: (weight: number, px: number) => `${weight} ${px}px ${sans}, ${tamil}, sans-serif`,
    display: (weight: number, px: number) => `${weight} ${px}px ${display}, ${tamil}, serif`,
  };
}
type Fonts = Awaited<ReturnType<typeof kitFonts>>;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw an image to fill the box, cropping the overflow (like CSS object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

/** Draw an image inside the box without cropping (object-fit: contain). */
function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function logoTile(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number) {
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x, y, size, size, size * 0.14);
  ctx.fill();
  const pad = size * 0.09;
  drawContain(ctx, img, x + pad, y + pad, size - pad * 2, size - pad * 2);
}

function circlePhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number, ring: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** Largest font size (down to min) at which the text fits on one line. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: (px: number) => string, start: number, min: number) {
  let px = start;
  ctx.font = font(px);
  while (px > min && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

/** Word-wrap into at most maxLines lines; the last line ends with … if cut. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

const formatPhone = (digits: string) => {
  const d = digits.replace(/[^0-9]/g, "");
  const local = d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : `+${d}`;
};

// ─── A4 poster (1240 × 1754 px = 150 dpi) ─────────────────────────────────────

export async function drawPoster(canvas: HTMLCanvasElement, agent: KitAgent, url: string, labels: KitLabels) {
  const W = 1240, H = 1754;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const theme = brandPreset(agent.brandColor);
  const f = await kitFonts();
  const [logo, photo, qr] = await Promise.all([loadImage(agent.logoUrl), loadImage(agent.photoUrl), qrImage(url, 720)]);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, 470);

  // Header: photo or logo, name, agency, tagline
  let textX = 90;
  if (photo) {
    circlePhoto(ctx, photo, 90 + 120, 235, 120, theme.accent);
    textX = 90 + 240 + 50;
  } else if (logo) {
    logoTile(ctx, logo, 90, 115, 240);
    textX = 90 + 240 + 50;
  }
  const textW = W - textX - 90;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  const heading = agent.agencyName || agent.displayName;
  fitFont(ctx, heading, textW, (px) => f.display(700, px), 78, 40);
  ctx.fillText(heading, textX, 215);
  if (agent.agencyName) {
    ctx.fillStyle = theme.accent;
    fitFont(ctx, agent.displayName, textW, (px) => f.sans(700, px), 46, 28);
    ctx.fillText(agent.displayName, textX, 285);
  }
  if (agent.tagline) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = f.sans(400, 34);
    wrap(ctx, agent.tagline, textW, 2).forEach((l, i) => ctx.fillText(l, textX, 350 + i * 44));
  }
  if (photo && logo) logoTile(ctx, logo, W - 90 - 130, 30, 130);

  // QR in the middle
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.font = f.display(700, 64);
  fitFont(ctx, labels.scanTitle, W - 160, (px) => f.display(700, px), 64, 36);
  ctx.fillText(labels.scanTitle, W / 2, 590);
  ctx.font = f.sans(400, 34);
  ctx.fillStyle = "#444444";
  ctx.fillText(labels.scanHint, W / 2, 645);
  const qrSize = 720;
  const qx = (W - qrSize) / 2, qy = 690;
  ctx.fillStyle = theme.accent;
  roundRect(ctx, qx - 24, qy - 24, qrSize + 48, qrSize + 48, 36);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, qx - 8, qy - 8, qrSize + 16, qrSize + 16, 24);
  ctx.fill();
  if (qr) ctx.drawImage(qr, qx, qy, qrSize, qrSize);

  // Contact
  ctx.fillStyle = theme.bg;
  ctx.font = f.sans(700, 76);
  ctx.fillText(formatPhone(agent.phone), W / 2, 1560);
  ctx.fillStyle = "#333333";
  fitFont(ctx, url.replace(/^https?:\/\//, ""), W - 180, (px) => f.sans(400, px), 38, 22);
  ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, 1625);
  ctx.font = f.sans(400, 30);
  const foot = [agent.officeAddress || agent.city, agent.reraNumber ? `RERA ${agent.reraNumber}` : ""].filter(Boolean).join("  ·  ");
  fitFont(ctx, foot, W - 180, (px) => f.sans(400, px), 30, 18);
  ctx.fillText(foot, W / 2, 1685);
  ctx.textAlign = "left";
}

// ─── Visiting card (1050 × 600 px = 3.5 × 2 in at 300 dpi) ─────────────────────

export async function drawCard(canvas: HTMLCanvasElement, agent: KitAgent, url: string, labels: KitLabels) {
  const W = 1050, H = 600;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const theme = brandPreset(agent.brandColor);
  const f = await kitFonts();
  const [logo, qr] = await Promise.all([loadImage(agent.logoUrl), qrImage(url, 220)]);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  const panel = 380;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, panel, H);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(panel, 0, 10, H);

  // Left panel: logo + agency
  ctx.textAlign = "center";
  if (logo) logoTile(ctx, logo, (panel - 190) / 2, 70, 190);
  ctx.fillStyle = "#FFFFFF";
  const agency = agent.agencyName || agent.displayName;
  ctx.font = f.display(700, 40);
  const agencyLines = wrap(ctx, agency, panel - 60, 2);
  agencyLines.forEach((l, i) => ctx.fillText(l, panel / 2, (logo ? 320 : 230) + i * 48));
  if (agent.tagline) {
    ctx.fillStyle = theme.accent;
    ctx.font = f.sans(400, 22);
    wrap(ctx, agent.tagline, panel - 60, 3).forEach((l, i) => ctx.fillText(l, panel / 2, (logo ? 330 : 240) + agencyLines.length * 48 + i * 30));
  }
  ctx.textAlign = "left";

  // Right side: name, phone, office, link, QR
  const x = panel + 50, right = W - 50;
  ctx.fillStyle = "#111111";
  fitFont(ctx, agent.displayName, right - x, (px) => f.display(700, px), 52, 30);
  ctx.fillText(agent.displayName, x, 115);
  ctx.fillStyle = theme.bg;
  ctx.font = f.sans(700, 40);
  ctx.fillText(formatPhone(agent.phone), x, 185);
  ctx.fillStyle = "#333333";
  ctx.font = f.sans(400, 24);
  const lines = [
    ...wrap(ctx, agent.officeAddress || agent.city, right - x - 240, 3),
    ...(agent.reraNumber ? [`RERA ${agent.reraNumber}`] : []),
  ];
  lines.forEach((l, i) => ctx.fillText(l, x, 250 + i * 34));
  if (qr) ctx.drawImage(qr, right - 210, H - 260, 210, 210);
  ctx.font = f.sans(400, 22);
  ctx.fillStyle = "#444444";
  fitFont(ctx, labels.cardScan, right - x - 230, (px) => f.sans(400, px), 22, 14);
  ctx.fillText(labels.cardScan, x, H - 90);
  fitFont(ctx, url.replace(/^https?:\/\//, ""), right - x - 230, (px) => f.sans(700, px), 24, 14);
  ctx.fillStyle = "#111111";
  ctx.fillText(url.replace(/^https?:\/\//, ""), x, H - 55);
}

// ─── Brochure (A4 pages, 1240 × 1754 px each) ─────────────────────────────────

export async function drawBrochure(agent: KitAgent, listing: KitListing, labels: KitLabels): Promise<HTMLCanvasElement[]> {
  const W = 1240, H = 1754, M = 80;
  const theme = brandPreset(agent.brandColor);
  const f = await kitFonts();
  const [logo, qr, ...photos] = await Promise.all([loadImage(agent.logoUrl), qrImage(listing.url, 260), ...listing.photos.slice(0, 7).map((p) => loadImage(p))]);
  const pics = photos.filter(Boolean) as HTMLImageElement[];

  const header = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, 170);
    let x = M;
    if (logo) {
      logoTile(ctx, logo, M, 25, 120);
      x = M + 150;
    }
    ctx.fillStyle = "#FFFFFF";
    fitFont(ctx, agent.agencyName || agent.displayName, W - x - 420, (px) => f.display(700, px), 46, 26);
    ctx.fillText(agent.agencyName || agent.displayName, x, 85);
    ctx.fillStyle = theme.accent;
    ctx.font = f.sans(400, 28);
    ctx.fillText(agent.agencyName ? agent.displayName : agent.city, x, 130);
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = f.sans(700, 38);
    ctx.fillText(formatPhone(agent.phone), W - M, 95);
    ctx.textAlign = "left";
  };

  const pages: HTMLCanvasElement[] = [];
  const page = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    header(ctx);
    pages.push(c);
    return ctx;
  };

  // Page 1: hero photo, price, facts, description
  const ctx = page();
  let y = 200;
  if (pics[0]) {
    ctx.save();
    roundRect(ctx, M, y, W - M * 2, 620, 24);
    ctx.clip();
    drawCover(ctx, pics[0], M, y, W - M * 2, 620);
    ctx.restore();
    y += 620 + 60;
  }
  ctx.fillStyle = theme.bg;
  ctx.font = f.sans(700, 64);
  ctx.fillText(listing.priceText, M, y + 10);
  y += 70;
  ctx.fillStyle = "#111111";
  ctx.font = f.display(700, 44);
  const titleLines = wrap(ctx, listing.title, W - M * 2, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, M, y + 10 + i * 54));
  y += titleLines.length * 54 + 10;
  ctx.fillStyle = "#444444";
  ctx.font = f.sans(400, 30);
  ctx.fillText(`${listing.kindText} · ${listing.areaText} · ${listing.place}`, M, y + 10);
  y += 50;

  // Facts
  const facts = listing.facts.slice(0, 4);
  if (facts.length) {
    const fw = (W - M * 2 - (facts.length - 1) * 20) / facts.length;
    facts.forEach((fact, i) => {
      const fx = M + i * (fw + 20);
      ctx.fillStyle = "#F4F1EA";
      roundRect(ctx, fx, y, fw, 110, 16);
      ctx.fill();
      ctx.fillStyle = "#666666";
      ctx.font = f.sans(400, 24);
      ctx.fillText(fact.label, fx + 22, y + 42);
      ctx.fillStyle = "#111111";
      fitFont(ctx, fact.value, fw - 44, (px) => f.sans(700, px), 32, 18);
      ctx.fillText(fact.value, fx + 22, y + 86);
    });
    y += 150;
  }

  ctx.fillStyle = "#222222";
  ctx.font = f.sans(400, 28);
  const room = Math.max(2, Math.floor((H - 120 - y) / 40));
  wrap(ctx, listing.description, W - M * 2, room).forEach((l, i) => ctx.fillText(l, M, y + 10 + i * 40));

  // Page 2: more photos, amenities, QR and contact
  const ctx2 = page();
  y = 210;
  const grid = pics.slice(1, 7);
  if (grid.length) {
    const cols = 2;
    const gw = (W - M * 2 - 30) / cols;
    const gh = gw * 0.68;
    grid.forEach((img, i) => {
      const gx = M + (i % cols) * (gw + 30);
      const gy = y + Math.floor(i / cols) * (gh + 30);
      ctx2.save();
      roundRect(ctx2, gx, gy, gw, gh, 18);
      ctx2.clip();
      drawCover(ctx2, img, gx, gy, gw, gh);
      ctx2.restore();
    });
    y += Math.ceil(grid.length / cols) * (gh + 30) + 20;
  }
  if (listing.amenities.length && y < H - 520) {
    ctx2.fillStyle = "#111111";
    ctx2.font = f.display(700, 36);
    ctx2.fillText(labels.amenities, M, y + 20);
    ctx2.font = f.sans(400, 28);
    ctx2.fillStyle = "#333333";
    wrap(ctx2, listing.amenities.join("  ·  "), W - M * 2, 3).forEach((l, i) => ctx2.fillText(l, M, y + 70 + i * 40));
    y += 200;
  }
  const by = H - 380;
  ctx2.fillStyle = "#F4F1EA";
  roundRect(ctx2, M, by, W - M * 2, 300, 24);
  ctx2.fill();
  if (qr) ctx2.drawImage(qr, W - M - 280, by + 20, 260, 260);
  ctx2.fillStyle = "#111111";
  ctx2.font = f.display(700, 40);
  fitFont(ctx2, labels.online, W - M * 2 - 360, (px) => f.display(700, px), 40, 24);
  ctx2.fillText(labels.online, M + 40, by + 80);
  ctx2.fillStyle = theme.bg;
  ctx2.font = f.sans(700, 44);
  ctx2.fillText(formatPhone(agent.phone), M + 40, by + 150);
  ctx2.fillStyle = "#333333";
  ctx2.font = f.sans(400, 26);
  wrap(ctx2, [agent.displayName, agent.officeAddress || agent.city, agent.reraNumber ? `RERA ${agent.reraNumber}` : ""].filter(Boolean).join(" · "), W - M * 2 - 360, 3).forEach((l, i) =>
    ctx2.fillText(l, M + 40, by + 200 + i * 34)
  );
  return pages;
}

// ─── Saving ───────────────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function canvasBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), type, quality));
}

/** One PDF page per canvas, each page the given size in millimetres. */
export async function canvasesToPdf(canvases: HTMLCanvasElement[], widthMm: number, heightMm: number): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation: widthMm > heightMm ? "landscape" : "portrait" });
  canvases.forEach((c, i) => {
    if (i > 0) doc.addPage([widthMm, heightMm], widthMm > heightMm ? "landscape" : "portrait");
    doc.addImage(c.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, widthMm, heightMm);
  });
  return doc.output("blob");
}
