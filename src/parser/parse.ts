import { Result } from "@praha/byethrow";

import type { ParsedDonation } from "./types";
import { splitBlocks } from "./blockSplitter";
import { parseAAElements } from "./aaParser";
import type { ParseError } from "./errors";

export const parseDonation = (
  text: string,
): Result.Result<ParsedDonation, ParseError> => {
  const blocksResult = splitBlocks(text);
  if (Result.isFailure(blocksResult)) return blocksResult;

  const [summonLines, aaLines, bodyLines, outroLines] = blocksResult.value;

  return Result.pipe(
    parseAAElements(aaLines),
    Result.map((aa) => ({
      summon: { lines: summonLines },
      aa,
      body: { lines: bodyLines, outroLines },
    })),
  );
};
