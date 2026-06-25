import type { RenderConfig, RenderRow } from "./types";
import { isEmoji } from "../../parser/charUtils";

const SCALE = 2;

type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export const DEFAULT_CONFIG: RenderConfig = {
  cellWidth: 20,
  cellHeight: 28,
  fontSize: 18,
  fontFamily: "'Courier New', 'Consolas', monospace",
  textColor: "#33ff33",
  bgColor: "#000000",
  padding: 16,
};

const drawRows = (
  ctx: DrawContext,
  rows: RenderRow[],
  config: RenderConfig,
  startRow: number,
): void => {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  rows.forEach((row, r) => {
    let xOffset = 0;
    row.forEach((cell) => {
      const cellW = (cell.width ?? 1) * config.cellWidth;

      if (cell.char.trim() !== "" || cell.char === "　") {
        const x = config.padding + xOffset + cellW / 2;
        const y =
          config.padding +
          (startRow + r) * config.cellHeight +
          config.cellHeight / 2;

        ctx.fillStyle = cell.color ?? config.textColor;

        if (isEmoji(cell.char)) {
          ctx.font = `${config.fontSize * 0.85}px ${config.fontFamily}`;
        } else {
          ctx.font = `${config.fontSize}px ${config.fontFamily}`;
        }

        ctx.fillText(cell.char, x, y);
      }

      xOffset += cellW;
    });
  });
};

const blitToDisplay = (
  offscreen: OffscreenCanvas,
  display: HTMLCanvasElement,
): void => {
  const dCtx = display.getContext("2d");
  if (!dCtx) return;

  const w = offscreen.width * SCALE;
  const h = offscreen.height * SCALE;
  display.width = w;
  display.height = h;
  display.style.maxWidth = `${offscreen.width}px`;
  display.style.height = "auto";

  dCtx.imageSmoothingEnabled = false;
  dCtx.drawImage(offscreen, 0, 0, w, h);
};

const blitRegion = (
  offscreen: OffscreenCanvas,
  display: HTMLCanvasElement,
  y: number,
  h: number,
): void => {
  const dCtx = display.getContext("2d");
  if (!dCtx) return;

  dCtx.imageSmoothingEnabled = false;
  dCtx.drawImage(
    offscreen,
    0,
    y,
    offscreen.width,
    h,
    0,
    y * SCALE,
    offscreen.width * SCALE,
    h * SCALE,
  );
};

export const renderToCanvas = (
  canvas: HTMLCanvasElement,
  rows: RenderRow[],
  config: RenderConfig = DEFAULT_CONFIG,
): void => {
  const rowWidth = (row: RenderRow) =>
    row.reduce((sum, cell) => sum + (cell.width ?? 1), 0);
  const maxWidth = rows.reduce((max, row) => Math.max(max, rowWidth(row)), 0);
  const logicalWidth = maxWidth * config.cellWidth + config.padding * 2;
  const logicalHeight = rows.length * config.cellHeight + config.padding * 2;

  const offscreen = new OffscreenCanvas(logicalWidth, logicalHeight);
  const ctx = offscreen.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  drawRows(ctx, rows, config, 0);

  blitToDisplay(offscreen, canvas);
};

export type CanvasContext = {
  offscreen: OffscreenCanvas;
  offCtx: OffscreenCanvasRenderingContext2D;
  display: HTMLCanvasElement;
};

export const setupCanvas = (
  canvas: HTMLCanvasElement,
  totalRows: number,
  maxCellWidth: number,
  config: RenderConfig = DEFAULT_CONFIG,
): CanvasContext | null => {
  const logicalWidth = maxCellWidth * config.cellWidth + config.padding * 2;
  const logicalHeight = totalRows * config.cellHeight + config.padding * 2;

  const offscreen = new OffscreenCanvas(logicalWidth, logicalHeight);
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return null;

  offCtx.fillStyle = config.bgColor;
  offCtx.fillRect(0, 0, logicalWidth, logicalHeight);

  const w = logicalWidth * SCALE;
  const h = logicalHeight * SCALE;
  canvas.width = w;
  canvas.height = h;
  canvas.style.maxWidth = `${logicalWidth}px`;
  canvas.style.height = "auto";

  return { offscreen, offCtx, display: canvas };
};

export const drawStaticRows = (
  ctx: CanvasContext,
  rows: RenderRow[],
  config: RenderConfig = DEFAULT_CONFIG,
): void => {
  drawRows(ctx.offCtx, rows, config, 0);
  blitToDisplay(ctx.offscreen, ctx.display);
};

export const drawBodyArea = (
  ctx: CanvasContext,
  rows: RenderRow[],
  config: RenderConfig,
  startRow: number,
  bodyHeight: number,
): void => {
  const y = config.padding + startRow * config.cellHeight;
  const h = bodyHeight * config.cellHeight;

  ctx.offCtx.fillStyle = config.bgColor;
  ctx.offCtx.fillRect(0, y, ctx.offscreen.width, h);

  drawRows(ctx.offCtx, rows, config, startRow);
  blitRegion(ctx.offscreen, ctx.display, y, h);
};
