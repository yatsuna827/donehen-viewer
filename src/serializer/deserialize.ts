import { Result } from "@praha/byethrow";

import type {
  ParsedDonation,
  SummonBlock,
  AABlock,
  BodyBlock,
} from "../parser/types";
import { CompactDonationSchema } from "./schema";

export type DeserializeError =
  | { type: "invalid-json" }
  | { type: "schema-validation-failed" };

export const deserialize = (
  data: string,
): Result.Result<ParsedDonation, DeserializeError> => {
  const jsonResult = Result.try({
    try: (): unknown => JSON.parse(data),
    catch: (): DeserializeError => ({ type: "invalid-json" }),
  });
  if (Result.isFailure(jsonResult)) return jsonResult;

  const parsed = CompactDonationSchema.safeParse(jsonResult.value);
  if (!parsed.success) {
    return Result.fail({ type: "schema-validation-failed" });
  }

  const c = parsed.data;

  const summon: SummonBlock = {
    lines: c.s,
  };

  const aa: AABlock = {
    initialLetter: c.i,
    gift: c.g,
    altar: deserializeAltar(c.ac, c.ak),
    frameLine: c.f,
    wall: c.w,
    variant: c.v ?? null,
  };

  const body: BodyBlock = {
    lines: c.b,
    outroLines: c.o,
  };

  return Result.succeed({ summon, aa, body });
};

const deserializeAltar = (
  cardinal: string,
  corners: string,
): AABlock["altar"] => {
  const c = [...cardinal];
  const k = [...corners];
  if (c.length === 4 && k.length === 4) {
    return {
      type: "surrounding",
      tiles: [c[0], c[1], c[2], c[3], k[0], k[1], k[2], k[3]],
    };
  }
  if (k.length === 4) {
    return { type: "corners", tiles: [k[0], k[1], k[2], k[3]] };
  }
  return {
    type: "cardinal",
    tiles: [c[0] ?? "", c[1] ?? "", c[2] ?? "", c[3] ?? ""],
  };
};
