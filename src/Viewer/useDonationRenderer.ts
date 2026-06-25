import { useEffect } from "react";

import { layoutAA } from "../engine/layout/layoutEngine";
import {
  renderHeaderBlock,
  renderTextLines,
  emptyRow,
  DEFAULT_CONFIG,
  setupCanvas,
  drawStaticRows,
  drawBodyArea,
  sliceBodyToIndex,
  getVisibleLines,
  getTotalCharCount,
  type RenderRow,
} from "../engine/renderer/";
import type { ParsedDonation } from "../parser/types";

const MS_PER_CHAR = 50;
const MS_PER_CHAR_OUTRO = 25;
const REVEAL_WAIT_MS = 500;
const OUTRO_WAIT_MS = 400;
const DEFAULT_BODY_VISIBLE_LINES = 8;

const HEADER_INNER_LINES = ["THANK YOU FROM", "DIEHARD TALES"];

// トリイが右から1本ずつ出現したあとサツガイが現れる特殊演出
const MS_PER_TORII = 200;
const TORII_COUNT = 7;
const SATSUGAI_WAIT_MS = 600;

type Phase =
  | "summon"
  | "wait-reveal"
  | "reveal"
  | "torii"
  | "wait-body"
  | "body"
  | "wait-outro"
  | "outro"
  | "done";

// NOTE: キャラが複数体の特殊ケースの場合は、3文字を1セルに詰め込みたいので、単一文字・全文字列の両方でマッチさせる
const hideInitial = (rows: RenderRow[], initialLetter: string): RenderRow[] =>
  rows.map((row) =>
    row.map((cell) =>
      cell.char.length > 0 && [...cell.char].every((c) => c === initialLetter)
        ? { ...cell, char: " " }
        : cell,
    ),
  );

export const useDonationRenderer = (
  parsed: ParsedDonation | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  bodyVisibleLines: number = DEFAULT_BODY_VISIBLE_LINES,
): void => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!parsed) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    const aaRows = layoutAA(parsed.aa);

    const headerRows: RenderRow[] = [
      ...renderHeaderBlock(HEADER_INNER_LINES),
      emptyRow(),
    ];

    const summonLines = parsed.summon.lines;
    const summonRowCount = summonLines.length;
    const summonTotalChars = getTotalCharCount(summonLines);

    const aaRowCount = aaRows.length;

    const bodyLines = parsed.body.lines;
    const outroLines = parsed.body.outroLines;
    const hasOutro = outroLines.length > 0;
    const allBodyLines = hasOutro
      ? [...bodyLines, "", ...outroLines]
      : bodyLines;
    const bodyTotalChars = getTotalCharCount(bodyLines);
    const outroTotalChars = getTotalCharCount(outroLines);

    const headerRowCount = headerRows.length;
    const summonStart = headerRowCount;
    const aaStart = summonStart + summonRowCount + 1;
    const bodyStart = aaStart + aaRowCount + 1;
    const totalRowCount = bodyStart + bodyVisibleLines;

    const rowWidth = (row: RenderRow) =>
      row.reduce((sum, cell) => sum + (cell.width ?? 1), 0);
    const maxHeaderWidth = headerRows.reduce(
      (max, row) => Math.max(max, rowWidth(row)),
      0,
    );
    const maxSummonWidth = summonLines.reduce(
      (max, line) => Math.max(max, [...line].length),
      0,
    );
    const maxAaWidth = aaRows.reduce(
      (max, row) => Math.max(max, rowWidth(row)),
      0,
    );
    const maxBodyWidth = allBodyLines.reduce(
      (max, line) => Math.max(max, [...line].length),
      0,
    );
    const maxCellWidth = Math.max(
      maxHeaderWidth,
      maxSummonWidth,
      maxAaWidth,
      maxBodyWidth,
    );

    const canvasCtx = setupCanvas(
      canvas,
      totalRowCount,
      maxCellWidth,
      DEFAULT_CONFIG,
    );
    if (!canvasCtx) return;

    if (headerRows.length > 0) {
      drawStaticRows(canvasCtx, headerRows, DEFAULT_CONFIG);
    }

    const isSatsugai = parsed.aa.variant === "satsugai";
    const aaRowsPreReveal = isSatsugai
      ? layoutAA(parsed.aa, { toriiVisible: 0 })
      : aaRows;
    const aaWithoutInitial = hideInitial(
      aaRowsPreReveal,
      parsed.aa.initialLetter,
    );
    drawBodyArea(
      canvasCtx,
      [emptyRow(), ...aaWithoutInitial, emptyRow()],
      DEFAULT_CONFIG,
      summonStart + summonRowCount,
      aaRowCount + 2,
    );

    let phase: Phase = "summon";
    let charIndex = 0;
    let rafId: number;
    let lastTime = 0;
    let accum = 0;
    let scrollOffset = 0;

    const animate = (time: number) => {
      if (lastTime > 0) {
        accum += time - lastTime;
      }
      lastTime = time;

      if (phase === "summon") {
        const charsToAdd = Math.floor(accum / MS_PER_CHAR);
        if (charsToAdd > 0) {
          accum -= charsToAdd * MS_PER_CHAR;
          charIndex = Math.min(charIndex + charsToAdd, summonTotalChars);
          const sliced = sliceBodyToIndex(summonLines, charIndex);
          const visibleRows = renderTextLines(sliced);
          drawBodyArea(
            canvasCtx,
            visibleRows,
            DEFAULT_CONFIG,
            summonStart,
            summonRowCount,
          );

          if (charIndex >= summonTotalChars) {
            phase = "wait-reveal";
            accum = 0;
          }
        }
      } else if (phase === "wait-reveal") {
        if (accum >= REVEAL_WAIT_MS) {
          phase = "reveal";
          accum = 0;
        }
      } else if (phase === "reveal") {
        if (isSatsugai) {
          phase = "torii";
          charIndex = 0;
          accum = 0;
        } else {
          drawBodyArea(
            canvasCtx,
            [emptyRow(), ...aaRows, emptyRow()],
            DEFAULT_CONFIG,
            summonStart + summonRowCount,
            aaRowCount + 2,
          );
          phase = "wait-body";
          accum = 0;
        }
      } else if (phase === "torii") {
        if (charIndex < TORII_COUNT) {
          const toriiToAdd = Math.floor(accum / MS_PER_TORII);
          if (toriiToAdd > 0) {
            accum -= toriiToAdd * MS_PER_TORII;
            charIndex = Math.min(charIndex + toriiToAdd, TORII_COUNT);
            const rows = layoutAA(parsed.aa, { toriiVisible: charIndex });
            const hidden = hideInitial(rows, parsed.aa.initialLetter);
            drawBodyArea(
              canvasCtx,
              [emptyRow(), ...hidden, emptyRow()],
              DEFAULT_CONFIG,
              summonStart + summonRowCount,
              aaRowCount + 2,
            );
            if (charIndex >= TORII_COUNT) {
              accum = 0;
            }
          }
        } else if (accum >= SATSUGAI_WAIT_MS) {
          const rows = layoutAA(parsed.aa, { toriiVisible: TORII_COUNT });
          drawBodyArea(
            canvasCtx,
            [emptyRow(), ...rows, emptyRow()],
            DEFAULT_CONFIG,
            summonStart + summonRowCount,
            aaRowCount + 2,
          );
          phase = "wait-body";
          accum = 0;
        }
      } else if (phase === "wait-body") {
        if (accum >= REVEAL_WAIT_MS) {
          phase = "body";
          charIndex = 0;
          accum = 0;
        }
      } else if (phase === "body") {
        const charsToAdd = Math.floor(accum / MS_PER_CHAR);
        if (charsToAdd > 0) {
          accum -= charsToAdd * MS_PER_CHAR;
          charIndex = Math.min(charIndex + charsToAdd, bodyTotalChars);
          const sliced = sliceBodyToIndex(allBodyLines, charIndex);
          const visible = getVisibleLines(sliced, bodyVisibleLines);
          const visibleRows = renderTextLines(visible);
          drawBodyArea(
            canvasCtx,
            visibleRows,
            DEFAULT_CONFIG,
            bodyStart,
            bodyVisibleLines,
          );

          if (charIndex >= bodyTotalChars) {
            if (hasOutro) {
              phase = "wait-outro";
              accum = 0;
            } else {
              phase = "done";
              scrollOffset = Math.max(
                0,
                allBodyLines.length - bodyVisibleLines,
              );
            }
          }
        }
      } else if (phase === "wait-outro") {
        if (accum >= OUTRO_WAIT_MS) {
          phase = "outro";
          charIndex = 0;
          accum = 0;
        }
      } else if (phase === "outro") {
        const charsToAdd = Math.floor(accum / MS_PER_CHAR_OUTRO);
        if (charsToAdd > 0) {
          accum -= charsToAdd * MS_PER_CHAR_OUTRO;
          charIndex = Math.min(charIndex + charsToAdd, outroTotalChars);
          const sliced = sliceBodyToIndex(
            allBodyLines,
            bodyTotalChars + charIndex,
          );
          const visible = getVisibleLines(sliced, bodyVisibleLines);
          const visibleRows = renderTextLines(visible);
          drawBodyArea(
            canvasCtx,
            visibleRows,
            DEFAULT_CONFIG,
            bodyStart,
            bodyVisibleLines,
          );

          if (charIndex >= outroTotalChars) {
            phase = "done";
            scrollOffset = Math.max(0, allBodyLines.length - bodyVisibleLines);
          }
        }
      }

      if (phase !== "done") {
        rafId = requestAnimationFrame(animate);
      }
    };

    const scrollTo = (offset: number) => {
      const maxOffset = Math.max(0, allBodyLines.length - bodyVisibleLines);
      scrollOffset = Math.max(0, Math.min(maxOffset, offset));
      const window = allBodyLines.slice(
        scrollOffset,
        scrollOffset + bodyVisibleLines,
      );
      drawBodyArea(
        canvasCtx,
        renderTextLines(window),
        DEFAULT_CONFIG,
        bodyStart,
        bodyVisibleLines,
      );
    };

    const onWheel = (e: WheelEvent) => {
      if (phase !== "done") return;
      e.preventDefault();
      scrollTo(scrollOffset + (e.deltaY > 0 ? 1 : -1));
    };

    let touchStartY = 0;
    let touchAccum = 0;
    const TOUCH_THRESHOLD = 30;

    const onTouchStart = (e: TouchEvent) => {
      if (phase !== "done") return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY = touch.clientY;
      touchAccum = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (phase !== "done") return;
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      const currentY = touch.clientY;
      touchAccum += touchStartY - currentY;
      touchStartY = currentY;
      const lines = Math.trunc(touchAccum / TOUCH_THRESHOLD);
      if (lines !== 0) {
        touchAccum -= lines * TOUCH_THRESHOLD;
        scrollTo(scrollOffset + lines);
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [parsed, canvasRef, bodyVisibleLines]);
};
