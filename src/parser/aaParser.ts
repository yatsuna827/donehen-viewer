import { Result } from "@praha/byethrow";

import type { AABlock } from "./types";
import { isWallChar } from "./charUtils";
import type { ParseError } from "./errors";

// 例：
// "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
// "ー　　　　　 　ー　　　　🌴　_ 🌴 ＃",
// "＃＃＃＃＃＃＃＃　　　　　 _ E _ ＃",
// "　　　　　　　＃ 　＠＄ 　🌴 _ 🌴 ＃",
// "　　　　　　　＃　 d　　　　　　＃",
// "　　　　　　　＃＃＃＃＃＃＃＃＃＃",

// 処理方針
// - `#`はすべて無視する
// - 空白もすべて無視する
// - 扉 `ー` も無視する
// - 1行目と6行目は壁しかないので無視する
// - 召喚されたキャラクターは3行目にいる
// - 自分は4行目にいる
// - 自分を基準に、右隣にドネート金貨があり、下に犬がいる
// - それ以外の全てが祭壇
//   - 祭壇のパターンは、上下左右4マス / 四隅4マス / 周囲8マスの3パターンを想定する

export const parseAAElements = (
  rawLines: string[],
): Result.Result<AABlock, ParseError> => {
  if (rawLines.length !== 6 && rawLines.length !== 7) {
    return Result.fail({ type: "invalid-aa-line-count" });
  }

  const frameLine = rawLines.length === 7 ? rawLines[0] : "";
  const contentLines = rawLines.length === 7 ? rawLines.slice(1) : rawLines;

  return Result.pipe(
    extractAAElements(contentLines),
    Result.map((result) => ({ ...result, frameLine })),
  );
};

// 文字に分解し、スペース、壁、ドアを削除する
const strip = (line: string): string[] => {
  const chars = [...line];

  const first = chars.findIndex((c) => !isSpace(c));
  if (first === -1) return [];
  const last = chars.findLastIndex((c) => !isSpace(c));

  const trimmed = chars.slice(first, last + 1);

  const isWall = (c: string) => c === "＃" || c === "🌸";

  const wallEnd = trimmed.findIndex((c) => !isWall(c));
  if (wallEnd === -1) return [];
  const inner = trimmed.slice(wallEnd);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (isWall(inner.at(-1)!) ? inner.slice(0, -1) : inner).filter(
    (c) => !isSpace(c) && c !== "ー",
  );
};
const isSpace = (c: string) => /[\s　]/.test(c);

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  // FIXME: テストコードとしての質が悪いから直す
  describe("strip", () => {
    describe("コンテンツなし", () => {
      it("壁が1つ", () => {
        expect(strip("＃")).toEqual([]);
      });
      it("壁が複数", () => {
        expect(strip("＃＃＃＃＃＃＃＃＃")).toEqual([]);
      });
      it("空白+壁", () => {
        expect(strip("　　＃＃＃＃＃＃＃")).toEqual([]);
      });
      it("ドアのみ", () => {
        expect(strip("ーーー")).toEqual([]);
      });
      it("壁・ドア・空白の混合", () => {
        expect(strip("＃ー　ー　")).toEqual([]);
      });
      it("空白のみ", () => {
        expect(strip("　 　 ")).toEqual([]);
      });
      it("空文字列", () => {
        expect(strip("")).toEqual([]);
      });
    });

    describe("壁", () => {
      it("左右の壁に囲まれたコンテンツが抽出される", () => {
        expect(strip("＃abc＃")).toEqual(["a", "b", "c"]);
      });

      describe("左壁", () => {
        it("左側の壁が複数あってもすべて除去される", () => {
          expect(strip("＃＃＃abc＃")).toEqual(["a", "b", "c"]);
        });
        it("左側の壁が空白で途切れていると途切れた先の壁は残る", () => {
          expect(strip("＃ ＃abc＃")).toEqual(["＃", "a", "b", "c"]);
        });
        it("左側の壁がドアで途切れていると途切れた先の壁は残る", () => {
          expect(strip("ー＃abc＃")).toEqual(["＃", "a", "b", "c"]);
        });
      });

      describe("右壁", () => {
        it("右壁がない場合は右端はそのまま維持される", () => {
          expect(strip("＃abcd")).toEqual(["a", "b", "c", "d"]);
        });
        it("右端に壁が1つある場合はその壁が除去される", () => {
          expect(strip("abc＃")).toEqual(["a", "b", "c"]);
        });
        it("右端に壁が2つあると1つだけ除去され1つ残る", () => {
          expect(strip("＃abc＃＃")).toEqual(["a", "b", "c", "＃"]);
        });
        it("右端に壁が3つあると1つだけ除去され2つ残る", () => {
          expect(strip("＃abc＃＃＃")).toEqual(["a", "b", "c", "＃", "＃"]);
        });
      });

      it("コンテンツの間にある壁は除去されずに残る", () => {
        expect(strip("＃a＃b＃")).toEqual(["a", "＃", "b"]);
      });
    });

    describe("空白", () => {
      it("両端の空白は壁の外側でも除去される", () => {
        expect(strip("　　＃abc＃　")).toEqual(["a", "b", "c"]);
      });
      it("コンテンツ間の空白は除去される", () => {
        expect(strip("＃a 　b＃")).toEqual(["a", "b"]);
      });
    });

    describe("ドア", () => {
      it("左端のドア", () => {
        expect(strip("ーabc")).toEqual(["a", "b", "c"]);
      });
      it("右端のドア", () => {
        expect(strip("abcー")).toEqual(["a", "b", "c"]);
      });
      it("コンテンツ間のドア", () => {
        expect(strip("aーb")).toEqual(["a", "b"]);
      });
      it("壁に囲まれた内側のドア", () => {
        expect(strip("＃aーb＃")).toEqual(["a", "b"]);
      });
    });

    describe("コンテンツの種別", () => {
      it("絵文字もコンテンツとして抽出される", () => {
        expect(strip("＃🌴＃")).toEqual(["🌴"]);
      });
      it("全角文字もコンテンツとして抽出される", () => {
        expect(strip("＃＠＄＃")).toEqual(["＠", "＄"]);
      });
    });
  });
}

const extractAAElements = (
  contentLines: string[],
): Result.Result<Omit<AABlock, "frameLine">, ParseError> => {
  // 1行目は壁のみで構成される行なので、
  // 適当に先頭の文字を切り出して、壁を構成する文字を決め打ちする
  // NOTE: 文字に分解せずに[0]でアクセスするとマルチバイトの絵文字が正しく参照できない
  const wall = [...contentLines[0].trim()][0];
  if (!isWallChar(wall)) return Result.fail({ type: "invalid-wall-char" });

  const row2 = strip(contentLines[1]);
  const row3 = strip(contentLines[2]);
  const row4 = strip(contentLines[3]);
  const row5 = strip(contentLines[4]);

  // ローグ犬がいなければ形式違反
  if (!row5.includes("d")) return Result.fail({ type: "missing-dog" });

  // 4行目から本質的な文字だけ抜き出すと、「自分」「ドネート金貨」「祭壇の下端」の順に並んでいるはず
  const self = row4[0];
  if (self !== "@" && self !== "＠")
    return Result.fail({ type: "invalid-self-char" });

  const gift = row4[1];
  if (!gift) return Result.fail({ type: "missing-gift" });

  // 3行目は召喚されたキャラクターがいる
  const guest = row3.find((c) => /[A-Z]/.test(c));
  if (!guest) return Result.fail({ type: "missing-guest" });

  const alterTop = row2;
  const [alterMiddle, isSatsugai] = (() => {
    // NOTE: サツガイが連なるトリイを伴っている特殊なドネ返が確認されたため、その対応
    const idx = row3.indexOf(guest);
    const right = row3.slice(idx + 1);

    return right.length > 1 && new Set(right).size === 1
      ? // 祭壇の右側はトリイで隠れているが、トリイ出現までは左のマスと同じ文字を表示する
        [[row3[idx - 1] ?? "　", row3[idx - 1] ?? "　"], true]
      : [row3.filter((c) => c !== guest), false];
  })();
  const alterBottom = row4.slice(2);

  const altarResult = ((): Result.Result<AABlock["altar"], ParseError> => {
    const alterTiles =
      alterTop.length + alterMiddle.length + alterBottom.length;
    if (alterTiles !== 4 && alterTiles !== 8)
      return Result.fail({ type: "invalid-altar-tile-count" });

    // 上下左右4マス
    if (alterMiddle.length === 2 && alterTop.length === 1) {
      return Result.succeed({
        type: "cardinal",
        tiles: [alterTop[0], alterMiddle[0], alterMiddle[1], alterBottom[0]],
      });
    }
    // 四隅4マス
    else if (alterMiddle.length === 0) {
      return Result.succeed({
        type: "corners",
        tiles: [alterTop[0], alterTop[1], alterBottom[0], alterBottom[1]],
      });
    }
    // 周囲8マス
    else {
      return Result.succeed({
        type: "surrounding",
        tiles: [
          alterTop[1],
          alterMiddle[0],
          alterMiddle[1],
          alterBottom[1],
          alterTop[0],
          alterTop[2],
          alterBottom[0],
          alterBottom[2],
        ],
      });
    }
  })();

  // 同一キャラが複数体召喚されるパターン（例: "RRR"）への対応
  const guestCount = row3.filter((c) => c === guest).length;

  return Result.pipe(
    altarResult,
    Result.map((altar) => ({
      initialLetter: guest,
      gift,
      altar,
      wall,
      variant: isSatsugai
        ? ("satsugai" as const)
        : guestCount > 1
          ? ("multiple" as const)
          : null,
    })),
  );
};

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  const { splitBlocks } = await import("./blockSplitter");
  const {
    EXAMPLE_1_DONATE,
    EXAMPLE_2_GENDAI,
    EXAMPLE_3_NATSU,
    EXAMPLE_4_FIGHTING,
    EXAMPLE_5_HANAMI,
    EXAMPLE_7_TRII,
    EXAMPLE_8_MULTIPLE,
  } = await import("./__tests__/fixtures");

  describe("parseAAElements", () => {
    it("上下左右4マスに`_`、斜めに🌴の祭壇", () => {
      // Arrange
      const raw = Result.unwrap(splitBlocks(EXAMPLE_1_DONATE));

      // Act
      const elements = Result.unwrap(parseAAElements(raw[1]));

      // Assert
      expect(elements).toEqual({
        initialLetter: "E",
        gift: "＄",
        altar: {
          type: "surrounding",
          tiles: ["_", "_", "_", "_", "🌴", "🌴", "🌴", "🌴"],
        },
        frameLine: "",
        wall: "＃",
        variant: null,
      });
    });

    it("上下左右4マス`_`の祭壇", () => {
      // Arrange
      const raw = Result.unwrap(splitBlocks(EXAMPLE_2_GENDAI));

      // Act
      const elements = Result.unwrap(parseAAElements(raw[1]));

      // Assert
      expect(elements).toEqual({
        initialLetter: "N",
        gift: "$",
        altar: {
          type: "cardinal",
          tiles: ["_", "_", "_", "_"],
        },
        frameLine: "",
        wall: "＃",
        variant: null,
      });
    });

    it("絵文字のフレーム付き", () => {
      // Arrange
      const raw = Result.unwrap(splitBlocks(EXAMPLE_3_NATSU));

      // Act
      const elements = Result.unwrap(parseAAElements(raw[1]));

      // Assert
      expect(elements).toEqual({
        initialLetter: "N",
        gift: "$",
        altar: {
          type: "cardinal",
          tiles: ["_", "_", "_", "_"],
        },
        frameLine: "🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝",
        wall: "＃",
        variant: null,
      });
    });
    it("漢字と絵文字が混ざったフレーム付き", () => {
      // Arrange
      const raw = Result.unwrap(splitBlocks(EXAMPLE_4_FIGHTING));

      // Act
      const elements = Result.unwrap(parseAAElements(raw[1]));

      // Assert
      expect(elements).toEqual({
        initialLetter: "N",
        gift: "$",
        altar: {
          type: "cardinal",
          tiles: ["_", "_", "_", "_"],
        },
        frameLine: "⬛🟩🟨🟨🟨🟨🟥殺伐🟥🟨🟨⬛⬛⬛⬛",
        wall: "＃",
        variant: null,
      });
    });
    it("壁も祭壇も🌸", () => {
      const raw = Result.unwrap(splitBlocks(EXAMPLE_5_HANAMI));
      const elements = Result.unwrap(parseAAElements(raw[1]));
      expect(elements).toEqual({
        initialLetter: "N",
        gift: "🍶",
        altar: {
          type: "cardinal",
          tiles: ["🌸", "🌸", "🌸", "🌸"],
        },
        frameLine: "",
        wall: "🌸",
        variant: null,
      });
    });

    it("サツガイ with くろいトリイ", () => {
      const raw = Result.unwrap(splitBlocks(EXAMPLE_7_TRII));
      const elements = Result.unwrap(parseAAElements(raw[1]));
      expect(elements).toEqual({
        initialLetter: "S",
        gift: "＄",
        altar: {
          type: "surrounding",
          tiles: ["_", "_", "_", "_", "🍁", "🍁", "🍁", "🍁"],
        },
        frameLine: "",
        wall: "＃",
        variant: "satsugai",
      });
    });

    it("キャラクター複数", () => {
      const raw = Result.unwrap(splitBlocks(EXAMPLE_8_MULTIPLE));
      const elements = Result.unwrap(parseAAElements(raw[1]));
      expect(elements).toEqual({
        initialLetter: "N",
        gift: "💰",
        altar: {
          type: "cardinal",
          tiles: ["_", "_", "_", "_"],
        },
        frameLine: "🌋🐉🌋🗻🗻⛰🌳🏰🌳⛰🗻🗻🌋🐙🌋",
        wall: "＃",
        variant: "multiple",
      });
    });
  });
}
