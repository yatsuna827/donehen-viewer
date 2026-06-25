import { describe, it, expect } from "vitest";
import {
  sliceBodyToIndex,
  getVisibleLines,
  getTotalCharCount,
} from "./bodyAnimator";

describe("sliceBodyToIndex", () => {
  const lines = ["あいう", "かきくけ", "さし"];

  it("0文字: 空配列", () => {
    expect(sliceBodyToIndex(lines, 0)).toEqual([]);
  });

  it("1行目の途中", () => {
    expect(sliceBodyToIndex(lines, 2)).toEqual(["あい"]);
  });

  it("1行目ちょうど", () => {
    expect(sliceBodyToIndex(lines, 3)).toEqual(["あいう"]);
  });

  it("2行目の途中", () => {
    expect(sliceBodyToIndex(lines, 5)).toEqual(["あいう", "かき"]);
  });

  it("全文字", () => {
    expect(sliceBodyToIndex(lines, 9)).toEqual(["あいう", "かきくけ", "さし"]);
  });

  it("全文字超過しても全行返す", () => {
    expect(sliceBodyToIndex(lines, 100)).toEqual([
      "あいう",
      "かきくけ",
      "さし",
    ]);
  });

  it("空行を含む", () => {
    const withEmpty = ["あ", "", "い"];
    expect(sliceBodyToIndex(withEmpty, 1)).toEqual(["あ"]);
    expect(sliceBodyToIndex(withEmpty, 2)).toEqual(["あ", "", "い"]);
  });
});

describe("getVisibleLines", () => {
  it("行数が表示行数以下ならそのまま", () => {
    expect(getVisibleLines(["a", "b"], 5)).toEqual(["a", "b"]);
  });

  it("行数が表示行数を超えたら末尾を返す", () => {
    expect(getVisibleLines(["a", "b", "c", "d", "e"], 3)).toEqual([
      "c",
      "d",
      "e",
    ]);
  });

  it("ちょうど一致", () => {
    expect(getVisibleLines(["a", "b", "c"], 3)).toEqual(["a", "b", "c"]);
  });
});

describe("getTotalCharCount", () => {
  it("全行の文字数合計", () => {
    expect(getTotalCharCount(["あいう", "かき"])).toBe(5);
  });

  it("空配列は0", () => {
    expect(getTotalCharCount([])).toBe(0);
  });

  it("空行は0文字としてカウント", () => {
    expect(getTotalCharCount(["あ", "", "い"])).toBe(2);
  });
});
