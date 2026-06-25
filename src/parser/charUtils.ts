export const isEmoji = (char: string): boolean =>
  /\p{Extended_Pictographic}/u.test(char);

export const isHeaderBorderLine = (line: string): boolean => {
  const chars = [...line].filter((c) => !/[\s　]/.test(c));

  return chars.length > 0 && chars.every((c) => c === "＊");
};

const wallChars = new Set(["#", "＃", "🌸"]);

// 花見回では壁が全部🌸だった
export type WallChar = "#" | "＃" | "🌸";
export const isWallChar = (c: string): c is WallChar => wallChars.has(c);
export const isWallLine = (line: string): boolean => {
  const chars = [...line].filter((c) => !/[\s　]/.test(c));

  return chars.length > 0 && chars.every(isWallChar);
};
