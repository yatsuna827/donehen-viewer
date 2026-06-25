import { Result } from "@praha/byethrow";

import { isHeaderBorderLine, isWallLine } from "./charUtils";
import type { ParseError } from "./errors";

export const splitBlocks = (
  text: string,
): Result.Result<[string[], string[], string[], string[]], ParseError> => {
  const lines = strip(omitHeader(text.split("\n")));

  const summonResult = extractSummonMessage(lines);
  if (Result.isFailure(summonResult)) return summonResult;
  const [summonLines, restLines] = summonResult.value;

  const wallBottom = restLines.findLastIndex(isWallLine);
  if (wallBottom === -1) return Result.fail({ type: "missing-wall-line" });

  const aaLines = restLines.slice(0, wallBottom + 1);
  const bodyLines = strip(restLines.slice(wallBottom + 1));
  const [mainLines, outroLines] = splitOutro(bodyLines);

  return Result.succeed([summonLines, aaLines, mainLines, outroLines]);
};

const omitHeader = (lines: string[]): string[] => {
  return lines.slice(lines.findLastIndex(isHeaderBorderLine) + 1);
};
const extractSummonMessage = (
  lines: string[],
): Result.Result<[string[], string[]], ParseError> => {
  if (lines.length < 2)
    return Result.fail({ type: "insufficient-summon-lines" });

  // linesを上から見ていって、空でない行を最大2行切り出す
  // メッセージは「～～　が　～～ でてきた」か「～～ が ～～ しょうかんされた」のどちらかのはず
  const row1 = lines[0].trim();
  if (row1.at(-1) === "が") {
    return Result.succeed([[row1, lines[1].trim()], strip(lines.slice(2))]);
  } else {
    return Result.succeed([[row1], strip(lines.slice(1))]);
  }
};
// 「ドネート　ありがとう　ございました」「※こんげつ　は　○○かい　です」の定型文を切り出す
const splitOutro = (bodyLines: string[]): [string[], string[]] => {
  // 定型文は1行だけ or 2行 or 空行をあけて3行 のパターンを想定し、末尾3行を調べる
  const tail = bodyLines.slice(-3);
  const offset = tail.findLastIndex((line) => line.startsWith("ドネート"));
  if (offset === -1) return [bodyLines, []];

  const outroStart = bodyLines.length - 3 + offset;
  return [
    strip(bodyLines.slice(0, outroStart)),
    strip(bodyLines.slice(outroStart)),
  ];
};

const strip = (lines: string[]): string[] => {
  const result = [...lines];

  // 先頭の空行を落とす
  while (result[0]?.trim() === "") {
    result.shift();
  }
  // 末尾の空行を落とす
  while (result.at(-1)?.trim() === "") {
    result.pop();
  }

  return result;
};
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("strip", () => {
    it("入力の先頭から連続する空行がすべて削除されること", () => {
      // Arrange
      const lines = ["", "", "hello", "world"];

      // Act
      const result = strip(lines);

      // Assert
      expect(result).toEqual(["hello", "world"]);
    });
    it("入力の末尾に連続する空行がすべて削除されること", () => {
      // Arrange
      const lines = ["hello", "world", "", ""];

      // Act
      const result = strip(lines);

      // Assert
      expect(result).toEqual(["hello", "world"]);
    });
    it("中間の空行は残ること", () => {
      // Arrange
      const lines = ["hello", "", "", "world"];

      // Act
      const result = strip(lines);

      // Assert
      expect(result).toEqual(["hello", "", "", "world"]);
    });

    it("空配列を渡した場合、空配列が返ること", () => {
      // Arrange
      const lines: string[] = [];

      // Act
      const result = strip(lines);

      // Assert
      expect(result).toEqual([]);
    });
  });
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  const {
    EXAMPLE_1_DONATE,
    EXAMPLE_2_GENDAI,
    EXAMPLE_3_NATSU,
    EXAMPLE_4_FIGHTING,
    EXAMPLE_5_HANAMI,
    EXAMPLE_6_PERMANENT,
    EXAMPLE_7_TRII,
  } = await import("./__tests__/fixtures");

  describe("splitBlocks", () => {
    it("例1: ヘッダーあり・ドネート", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_1_DONATE),
      );

      expect(summon).toMatchInlineSnapshot(`
      [
        "🌴イビルヤモト🌴　が",
        "ドネートで　でてきた",
      ]
    `);
      expect(aa).toMatchInlineSnapshot(`
      [
        "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
        "ー　　　　　 　ー　　　　🌴　_ 🌴 ＃",
        "＃＃＃＃＃＃＃＃　　　　　 _ E _ ＃",
        "　　　　　　　＃ 　＠＄ 　🌴 _ 🌴 ＃",
        "　　　　　　　＃　 d　　　　　　＃",
        "　　　　　　　＃＃＃＃＃＃＃＃＃＃",
      ]
    `);
      expect(body).toMatchInlineSnapshot(`
      [
        "「ざんねんながら　イビルヤモトちゃん　なんだわさ",
        "　タピオカティーを　かってきてもらおう」",
      ]
    `);
      expect(outro).toMatchInlineSnapshot(`
      [
        "ドネート　ありがとう　ございました",
        "",
        "※ こんげつ　は　なつのビーチかい　です",
      ]
    `);
    });

    it("例2: ヘッダーなし・げんだいドネート", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_2_GENDAI),
      );

      expect(summon).toMatchInlineSnapshot(`
        [
          "🍁ニンジャ🍁　が",
          "げんだいドネート　で　しょうかんされた",
        ]
      `);
      expect(aa).toMatchInlineSnapshot(`
        [
          "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
          "ー　　　　　 　ー　　　 　_ ＃",
          "＃＃＃＃＃＃＃＃　　　 _ N _ ＃",
          "　　　　　　　＃ 　＠$ _ ＃",
          "　　　　　　　＃　 d　　　　　　＃",
          "　　　　　　　＃＃＃＃＃＃＃＃＃＃",
        ]
      `);
      expect(body).toMatchInlineSnapshot(`
        [
          "　ニンジャは　じょうじんの　さんばいの",
          "　きゃくりょくで　かべを　とびわたり",
          "　あなたの　さいふを　もちさってしまった！",
        ]
      `);
      expect(outro).toMatchInlineSnapshot(`
      [
        "ドネート　ありがとう　ございました",
        "",
        "※ こんげつは　げんだいドネートかい　です",
      ]
    `);
    });

    it("例3: ヘッダーなし・なつドネート（絵文字行あり）", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_3_NATSU),
      );

      expect(summon).toMatchInlineSnapshot(`
        [
          "🍉ニンジャ🍉　が",
          "なつドネート　で　しょうかんされた",
        ]
      `);
      expect(aa).toMatchInlineSnapshot(`
        [
          "🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝🏝",
          "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
          "ー　　　　　 　ー　　　 　_ ＃",
          "＃＃＃＃＃＃＃＃　　　 _ N _ ＃",
          "　　　　　　　＃ 　＠$ _ ＃",
          "　　　　　　　＃　 d　　　　　　＃",
          "　　　　　　　＃＃＃＃＃＃＃＃＃＃",
        ]
      `);
      expect(body).toMatchInlineSnapshot(`
        [
          "　７がつXにち☀️",
          "「バカンスちゅう　でも　かかさず　しゅぎょう。",
          "　あさから　タケノコを　６４かい　ジャンプで",
          "　とびこえました。　あしたは　１２８かい　です。",
        ]
      `);
      expect(outro).toMatchInlineSnapshot(`
      [
        "ドネート　ありがとう　ございました",
        "",
        "※ こんげつは　サマーリゾートかい　です",
      ]
    `);
    });

    it("例4: ヘッダーあり・かくゲードネート（漢字混じりフレーム行）", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_4_FIGHTING),
      );

      expect(summon).toMatchInlineSnapshot(`
        [
          "✊ニンジャ✊　が",
          "かくゲードネート　で　しょうかんされた",
        ]
      `);
      expect(aa).toMatchInlineSnapshot(`
        [
          "⬛🟩🟨🟨🟨🟨🟥殺伐🟥🟨🟨⬛⬛⬛⬛",
          "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
          "ー　　　　　 　ー　　　 　_ ＃",
          "＃＃＃＃＃＃＃＃　　　 _ N _ ＃",
          "　　　　　　　＃ 　＠$ _ ＃",
          "　　　　　　　＃　 d　　　　　　＃",
          "　　　　　　　＃＃＃＃＃＃＃＃＃＃",
        ]
      `);
      expect(body).toMatchInlineSnapshot(`
        [
          "「ドーモ　ニンジャ　です。」",
        ]
      `);
      expect(outro).toMatchInlineSnapshot(`
      [
        "ドネート　ありがとう　ございました",
        "",
        "※ こんげつは　かくとうゲームかい　です",
      ]
    `);
    });

    it("例5: ヘッダーあり・おはなみドネート（壁が🌸）", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_5_HANAMI),
      );

      expect(summon).toMatchInlineSnapshot(`
        [
          "🌸ニンジャ🌸　が",
          "おはなみドネート　で　しょうかんされた",
        ]
      `);
      expect(aa).toMatchInlineSnapshot(`
        [
          "🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸",
          "ー　　　　　 　ー　　　 　🌸 🌸",
          "🌸🌸🌸🌸🌸🌸🌸🌸　　　 🌸 N 🌸 🌸",
          "　　　　　　　🌸 　＠🍶 🌸 🌸",
          "　　　　　　　🌸　 d　　　　　　🌸",
          "　　　　　　　🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸",
        ]
      `);
      expect(body).toMatchInlineSnapshot(`
        [
          "「ドーモ　ニンジャ　です。」",
          "　おさけを　のんで　よっぱらっている！",
        ]
      `);
      expect(outro).toMatchInlineSnapshot(`
        [
          "ドネート　ありがとう　ございました",
          "",
          "※ こんげつは　はるのおはなみかい　です",
        ]
      `);
    });

    it("空文字列", () => {
      expect(Result.isFailure(splitBlocks(""))).toBe(true);
    });

    it("例6: 空行なし・※注釈が直後に続くパターン", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_6_PERMANENT),
      );

      expect(summon).toMatchInlineSnapshot(`
      [
        "かたくらフジオ　が　ドネートで　でてきた",
      ]
    `);
      expect(aa).toMatchInlineSnapshot(`
      [
        "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
        "ー　　　　　 　ー　　　　　_ 　　＃",
        "＃＃＃＃＃＃＃＃　　　　 _ K _ 　＃",
        "　　　　　　　＃ 　＠＄　　_　　＃",
        "　　　　　　　＃　 d　　　　　　＃",
        "　　　　　　　＃＃＃＃＃＃＃＃＃＃",
      ]
    `);
      expect(body).toMatchInlineSnapshot(`
      [
        "「よろしく」",
      ]
    `);
      expect(outro).toMatchInlineSnapshot(`
      [
        "ドネート　ありがとう　ございました",
        "※ このけっか　は　ランダム　です",
      ]
    `);
    });

    it("例7: ドネート行のみで※注釈なし", () => {
      const [summon, aa, body, outro] = Result.unwrap(
        splitBlocks(EXAMPLE_7_TRII),
      );

      expect(summon).toMatchInlineSnapshot(`
      [
        "🍁サツガイ🍁　が",
        "ドネートで　オンセンにあらわれた",
      ]
    `);
      expect(aa).toMatchInlineSnapshot(`
      [
        "＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃",
        "ー　　　　　 　ー　　　🍁　_ 🍁 ＃",
        "＃＃＃＃＃＃＃＃　　　 _ S⛩⛩⛩⛩⛩⛩⛩",
        "　　　　　　　＃ 　＠＄ 🍁 _ 🍁 ＃",
        "　　　　　　　＃　 d　　　　　　＃",
        "　　　　　　　＃＃＃＃＃＃＃＃＃＃",
      ]
    `);
      expect(body).toMatchInlineSnapshot(`
        [
          "　「BWAHAHAHAHAHAHA！",
          "　　MWAHAHAHAHAHAHAHA！」",
          "　くろい　トリイを　くぐり",
          "　サツガイが　あらわれた！",
        ]
      `);
      expect(outro).toMatchInlineSnapshot(`
      [
        "ドネート　ありがとう　ございました",
      ]
    `);
    });
  });
}
