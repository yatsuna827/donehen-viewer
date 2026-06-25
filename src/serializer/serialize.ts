import type { ParsedDonation, AABlock } from "../parser/types";
import type { CompactDonation } from "./schema";

export const serialize = (parsed: ParsedDonation): string => {
  const alter = serializeAltar(parsed.aa.altar);
  const compact: CompactDonation = {
    s: parsed.summon.lines,
    i: parsed.aa.initialLetter,
    g: parsed.aa.gift,
    ac: alter.cardinal,
    ak: alter.corners,
    f: parsed.aa.frameLine,
    b: parsed.body.lines,
    w: parsed.aa.wall,
    o: parsed.body.outroLines,
    v: parsed.aa.variant ?? undefined,
  };
  return JSON.stringify(compact);
};

const serializeAltar = (
  altar: AABlock["altar"],
): { cardinal: string; corners: string } => {
  switch (altar.type) {
    case "cardinal":
      return { cardinal: altar.tiles.join(""), corners: "" };
    case "corners":
      return { cardinal: "", corners: altar.tiles.join("") };
    case "surrounding":
      return {
        cardinal: altar.tiles.slice(0, 4).join(""),
        corners: altar.tiles.slice(4).join(""),
      };
  }
};

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Result } = await import("@praha/byethrow");
  const { compress } = await import("../lib/compression");
  const { deserialize } = await import("./deserialize");
  const { parseDonation } = await import("../parser/parse");
  const {
    EXAMPLE_1_DONATE,
    EXAMPLE_2_GENDAI,
    EXAMPLE_3_NATSU,
    EXAMPLE_4_FIGHTING,
    EXAMPLE_5_HANAMI,
    EXAMPLE_6_PERMANENT,
    EXAMPLE_7_TRII,
    EXAMPLE_8_MULTIPLE,
  } = await import("../parser/__tests__/fixtures");

  test.each(
    [
      EXAMPLE_1_DONATE,
      EXAMPLE_2_GENDAI,
      EXAMPLE_3_NATSU,
      EXAMPLE_4_FIGHTING,
      EXAMPLE_5_HANAMI,
      EXAMPLE_6_PERMANENT,
      EXAMPLE_7_TRII,
      EXAMPLE_8_MULTIPLE,
    ].map((text) => Result.unwrap(parseDonation(text))),
  )("serialize -> deserialize でデータが復元される", (parsed) => {
    expect(Result.unwrap(deserialize(serialize(parsed)))).toEqual(parsed);
  });

  const testdata: ParsedDonation = {
    summon: { lines: ["かたくらフジオ　が　ドネートで　でてきた"] },
    aa: {
      initialLetter: "K",
      gift: "＄",
      altar: { type: "cardinal", tiles: ["＃", "＃", "＃", "＃"] },
      frameLine: "＊＊＊＊＊＊＊＊",
      wall: "＃",
      variant: null,
    },
    body: {
      lines: ["「よろしく」"],
      outroLines: [
        "ドネート　ありがとう　ございました",
        "※ このけっか　は　ランダム　です",
      ],
    },
  };
  test("serialize -> compress snapshot", async () => {
    const compressed = await compress(serialize(testdata));
    expect(compressed).toMatchInlineSnapshot(
      `"eJxtjz9qglEQxK8iU78TfFfIEcQiChGxsEhhIcKbtxL89yESY0j1CYImKWJhE1A8jHMAr6DvSYKFsCzL7DL7mw6ekZUhjsRCnCgMZG8Kvwrf8l4cx24DWS7by_riOulrcSXmYoGKQwMZHuBQR4bTvgeHx1oa7b-i1kQGODyl1fBuwaGaiPxYoa-Qi--Ry-fxT_tqCodWOroFi1RBYRiZ-Sm-JGUmzsWeeEhGxcX_6Hcl8VX8EafiMoaPp5sU9Uu2lXnZ4i_nByrdM28apAc"`,
    );
  });
}
