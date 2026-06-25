import { describe, it, expect } from "vitest";
import { Result } from "@praha/byethrow";
import { layoutAA } from "./layoutEngine";
import { parseAAElements } from "../../parser/aaParser";
import { splitBlocks } from "../../parser/blockSplitter";
import {
  EXAMPLE_1_DONATE,
  EXAMPLE_2_GENDAI,
  EXAMPLE_3_NATSU,
} from "../../parser/__tests__/fixtures";

describe("layoutAA", () => {
  it("祭壇が8マス", () => {
    const raw = Result.unwrap(splitBlocks(EXAMPLE_1_DONATE));
    const elements = Result.unwrap(parseAAElements(raw[1]));
    const rows = layoutAA(elements);

    expect(rows.length).toBe(6);
    expect(rows[0]!.length).toBe(17);
    expect(rows[0]!.every((c) => c.char === "＃")).toBe(true);
    expect(rows[2]![14]!.char).toBe("E");
    expect(rows[1]![13]!.char).toBe("🌴");
    expect(rows[1]![15]!.char).toBe("🌴");
    expect(rows[1]![14]!.char).toBe("_");
  });

  it("フレーム装飾なし", () => {
    const raw = Result.unwrap(splitBlocks(EXAMPLE_2_GENDAI));
    const elements = Result.unwrap(parseAAElements(raw[1]));
    const rows = layoutAA(elements);

    expect(rows.length).toBe(6);
    expect(rows[2]![14]!.char).toBe("N");
    expect(rows[3]![9]!.char).toBe("＠");
    expect(rows[3]![10]!.char).toBe("$");
    expect(rows[1]![13]!.char).toBe("　");
    expect(rows[1]![15]!.char).toBe("　");
  });

  it("フレーム絵文字行あり", () => {
    const raw = Result.unwrap(splitBlocks(EXAMPLE_3_NATSU));
    const elements = Result.unwrap(parseAAElements(raw[1]));
    const rows = layoutAA(elements);

    expect(rows.length).toBe(7);
    expect(rows[0]!.every((c) => c.char === "🏝")).toBe(true);
    expect(rows[1]!.every((c) => c.char === "＃")).toBe(true);
    expect(rows[3]![14]!.char).toBe("N");
  });
});
