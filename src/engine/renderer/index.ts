export { emptyRow, renderHeaderBlock, renderTextLines } from "./blockRenderers";
export {
  getTotalCharCount,
  getVisibleLines,
  sliceBodyToIndex,
} from "./bodyAnimator";
export {
  type CanvasContext,
  DEFAULT_CONFIG,
  drawBodyArea,
  drawStaticRows,
  renderToCanvas,
  setupCanvas,
} from "./canvasRenderer";
export type { RenderCell, RenderConfig, RenderRow } from "./types";
