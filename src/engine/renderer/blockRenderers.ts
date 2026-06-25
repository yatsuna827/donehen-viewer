import type { RenderRow, RenderCell } from "./types";

export const renderTextLines = (lines: string[]): RenderRow[] =>
  lines.map((line) => [...line].map((char) => ({ char })));

const DEFAULT_BORDER_WIDTH = 17;

export const renderHeaderBlock = (innerLines: string[]): RenderRow[] => {
  const contentData = innerLines.map((text, i) =>
    buildHeaderContentRow(text, i),
  );
  const maxContentWidth = Math.max(...contentData.map((d) => d.totalWidth), 0);
  const borderWidth = Math.max(
    DEFAULT_BORDER_WIDTH,
    Math.ceil(maxContentWidth) + 2,
  );

  const borderRow: RenderRow = Array.from<unknown, RenderCell>(
    { length: borderWidth },
    () => ({ char: "＊" }),
  );

  const innerWidth = borderWidth - 2;

  const contentRows: RenderRow[] = contentData.map(({ cells, totalWidth }) => {
    const pad = innerWidth - totalWidth;
    const leftPad = pad / 2;
    const rightPad = pad - leftPad;

    const row: RenderCell[] = [{ char: "＊" }];
    if (leftPad > 0) row.push({ char: " ", width: leftPad });
    row.push(...cells);
    if (rightPad > 0) row.push({ char: " ", width: rightPad });
    row.push({ char: "＊" });
    return row;
  });

  return [borderRow, ...contentRows, borderRow];
};

const WORD_GAP_FIRST = 1;
const WORD_GAP_REST = 0.5;
const INDENT_REST = 0;

const buildHeaderContentRow = (
  text: string,
  lineIndex: number,
): { cells: RenderCell[]; totalWidth: number } => {
  const words = text.split(/[\s　]+/).filter((w) => w.length > 0);
  const gap = lineIndex === 0 ? WORD_GAP_FIRST : WORD_GAP_REST;
  const indent = lineIndex === 0 ? 0 : INDENT_REST;

  const cells: RenderCell[] = [];
  let totalWidth = indent;
  if (indent > 0) cells.push({ char: " ", width: indent });

  words.forEach((word, wi) => {
    if (wi > 0) {
      cells.push({ char: " ", width: gap });
      totalWidth += gap;
    }
    for (const ch of word) {
      cells.push({ char: ch });
      totalWidth += 1;
    }
  });

  return { cells, totalWidth };
};

export const emptyRow = (): RenderRow => [{ char: " " }];
