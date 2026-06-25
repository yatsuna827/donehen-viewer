export const sliceBodyToIndex = (
  lines: string[],
  charIndex: number,
): string[] => {
  const result: string[] = [];
  let remaining = charIndex;

  for (const line of lines) {
    const chars = [...line];
    if (remaining <= 0) break;

    if (remaining >= chars.length) {
      result.push(line);
      remaining -= chars.length;
    } else {
      result.push(chars.slice(0, remaining).join(""));
      remaining = 0;
    }
  }

  return result;
};

export const getVisibleLines = (
  lines: string[],
  visibleCount: number,
): string[] => {
  if (lines.length <= visibleCount) return [...lines];
  return lines.slice(lines.length - visibleCount);
};

export const getTotalCharCount = (lines: string[]): number =>
  lines.reduce((sum, line) => sum + [...line].length, 0);
