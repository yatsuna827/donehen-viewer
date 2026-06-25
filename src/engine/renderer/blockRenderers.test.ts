import { describe, it, expect } from "vitest";
import { renderTextLines, emptyRow } from "./blockRenderers";

describe("renderTextLines", () => {
  it("各文字を1セルに変換する", () => {
    const rows = renderTextLines(["ABC"]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.length).toBe(3);
    expect(rows[0]![0]!.char).toBe("A");
    expect(rows[0]![1]!.char).toBe("B");
    expect(rows[0]![2]!.char).toBe("C");
  });

  it("全角文字も1セル", () => {
    const rows = renderTextLines(["＊＃"]);
    expect(rows[0]!.length).toBe(2);
    expect(rows[0]![0]!.char).toBe("＊");
    expect(rows[0]![1]!.char).toBe("＃");
  });

  it("絵文字も1セル", () => {
    const rows = renderTextLines(["🌴A🍉"]);
    expect(rows[0]!.length).toBe(3);
    expect(rows[0]![0]!.char).toBe("🌴");
    expect(rows[0]![2]!.char).toBe("🍉");
  });

  it("複数行を変換する", () => {
    const rows = renderTextLines(["AB", "CD"]);
    expect(rows.length).toBe(2);
  });
});

describe("emptyRow", () => {
  it("スペース1セルの行を返す", () => {
    const row = emptyRow();
    expect(row.length).toBe(1);
    expect(row[0]!.char).toBe(" ");
  });
});
