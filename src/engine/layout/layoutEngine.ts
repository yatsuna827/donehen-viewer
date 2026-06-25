import type { AABlock } from "../../parser/types";
import type { RenderCell, RenderRow } from "../renderer/types";

const cell = (char: string): RenderCell => ({ char });
const fill = (char: string, n: number): RenderCell[] =>
  Array.from({ length: n }, () => cell(char));

const E = "　";

type LayoutAAOptions = {
  toriiVisible: number;
};
export const layoutAA = (
  elements: AABlock,
  options?: LayoutAAOptions,
): RenderRow[] => {
  const { initialLetter, gift, altar, frameLine, wall: F, variant } = elements;

  const [T, L, R, B, TL, TR, BL, BR] = (() => {
    switch (altar.type) {
      case "cardinal":
        return [...altar.tiles, E, E, E, E];
      case "corners":
        return [E, E, E, E, ...altar.tiles];
      case "surrounding":
        return altar.tiles;
    }
  })();

  const rows: RenderRow[] = [];

  if (frameLine) {
    rows.push([...frameLine].map((c) => cell(c)));
  }

  rows.push(fill(F, 17));

  rows.push([
    cell("ー"),
    ...fill(E, 6),
    cell("ー"),
    ...fill(E, 5),
    cell(TL),
    cell(T),
    cell(TR),
    cell(F),
  ]);

  // サツガイが連なるトリイを伴っている特殊演出への対応
  if (variant === "satsugai") {
    const base = [R, F, E, E, E, E, E];
    const visible = options?.toriiVisible ?? 0;
    const threshold = base.length - visible;
    rows.push([
      ...fill(F, 8),
      ...fill(E, 5),
      cell(L),
      cell(initialLetter),
      ...base.map((ch, i) => cell(i >= threshold ? "⛩" : ch)),
    ]);
  } else {
    // multiple: 複数体のイニシャルを1セル幅に詰めて行幅を維持する
    const initialCells: RenderCell[] =
      variant === "multiple"
        ? [{ char: initialLetter.repeat(3), width: 1 }]
        : [cell(initialLetter)];
    rows.push([
      ...fill(F, 8),
      ...fill(E, 5),
      cell(L),
      ...initialCells,
      cell(R),
      cell(F),
    ]);
  }

  rows.push([
    ...fill(E, 7),
    cell(F),
    cell(E),
    cell("＠"),
    cell(gift),
    ...fill(E, 2),
    cell(BL),
    cell(B),
    cell(BR),
    cell(F),
  ]);

  rows.push([
    ...fill(E, 7),
    cell(F),
    cell(E),
    cell("d"),
    ...fill(E, 6),
    cell(F),
  ]);

  rows.push([...fill(E, 7), ...fill(F, 10)]);

  return rows;
};
