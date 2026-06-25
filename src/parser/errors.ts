export type ParseError =
  | { type: "insufficient-summon-lines" }
  | { type: "missing-wall-line" }
  | { type: "invalid-aa-line-count" }
  | { type: "invalid-wall-char" }
  | { type: "missing-dog" }
  | { type: "invalid-self-char" }
  | { type: "missing-gift" }
  | { type: "missing-guest" }
  | { type: "invalid-altar-tile-count" };
