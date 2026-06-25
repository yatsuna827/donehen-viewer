import type { WallChar } from "./charUtils";

export type SummonBlock = {
  lines: string[];
};

export type AABlock = {
  initialLetter: string;
  gift: string;
  altar:
    | { type: "cardinal"; tiles: Cardinal }
    | { type: "corners"; tiles: Corners }
    | { type: "surrounding"; tiles: Surrounding };
  frameLine: string;
  wall: WallChar;
  // 特例的なドネ返に対応するためのフラグ
  variant: "satsugai" | "multiple" | null;
};
type Cardinal = [top: string, left: string, right: string, bottom: string];
type Corners = [
  topLeft: string,
  topRight: string,
  bottomLeft: string,
  bottomRight: string,
];
type Surrounding = [
  top: string,
  left: string,
  right: string,
  bottom: string,
  topLeft: string,
  topRight: string,
  bottomLeft: string,
  bottomRight: string,
];

export type BodyBlock = {
  lines: string[];
  outroLines: string[];
};

export type ParsedDonation = {
  summon: SummonBlock;
  aa: AABlock;
  body: BodyBlock;
};

export type RawBlocks = {
  summonLines: string[];
  aaLines: string[];
  bodyLines: string[];
};
