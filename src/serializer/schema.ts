import { z } from "zod/mini";

const grapheme = (n: number) =>
  z.string().check(z.refine((v) => [...v].length === n));

export const CompactDonationSchema = z.object({
  s: z.array(z.string()), // summonLines
  i: z.string(), // initialLetter
  g: grapheme(1), // gift
  ac: grapheme(4), // altarCardinal 上 左 右 下の順に4文字
  ak: z.union([z.literal(""), grapheme(4)]), // altarCorner 左上 右上 左下 右下の順に4文字 or 空文字
  f: z.string(), // frameLine
  b: z.array(z.string()), // bodyLines
  w: z.catch(z.enum(["#", "＃", "🌸"]), "＃"), // wall
  o: z.array(z.string()), // outroLines
  v: z.catch(z.optional(z.enum(["satsugai", "multiple"])), undefined), // variant
});
export type CompactDonation = z.input<typeof CompactDonationSchema>;

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("zodの文字列長バリデーションのサロゲートペアの扱い", () => {
    const char = "🌸";

    it("z.length(1)に合格しない", () => {
      const schema = z.string().check(z.length(1));

      expect(schema.safeParse(char).success).toBe(false);
    });

    it("z.refine([...v].length === 1)なら合格する", () => {
      const schema = z.string().check(z.refine((v) => [...v].length === 1));

      expect(schema.safeParse(char).success).toBe(true);
    });
  });
}
