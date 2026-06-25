import type { ParseError } from "./errors";

export const parseErrorMessage = (error: ParseError): string => {
  switch (error.type) {
    case "insufficient-summon-lines":
      return "メッセージを検出できませんでした";
    case "missing-wall-line":
      return "想定しないAAです";
    case "invalid-aa-line-count":
      return "想定しないAAです";
    case "invalid-wall-char":
      return "想定しないAAです";
    case "missing-dog":
      return "ローグ犬が見つかりませんでした";
    case "invalid-self-char":
      return "あなたが見つかりませんでした";
    case "missing-gift":
      return "ドネート金貨が見つかりませんでした";
    case "missing-guest":
      return "召喚されたキャラクターが見つかりませんでした";
    case "invalid-altar-tile-count":
      return "祭壇の検出に失敗しました";
  }
};
