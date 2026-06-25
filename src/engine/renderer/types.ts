export type RenderCell = {
  char: string;
  color?: string;
  width?: number;
};

export type RenderRow = RenderCell[];

export type RenderConfig = {
  cellWidth: number;
  cellHeight: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  bgColor: string;
  padding: number;
};
