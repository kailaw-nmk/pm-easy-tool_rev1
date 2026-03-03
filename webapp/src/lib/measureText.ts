const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Yu Gothic', 'YuGothic', sans-serif";
const PADDING_X = 10;
const PADDING_Y = 8;

let cachedCtx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (!cachedCtx) {
    cachedCtx = document.createElement('canvas').getContext('2d');
  }
  return cachedCtx;
}

export function measureMilestoneText(
  lines: string[],
  fontSize: number,
): { width: number; height: number } {
  if (lines.length === 0) return { width: 0, height: 0 };

  const ctx = getCtx();
  const lineHeight = fontSize + 3;

  if (!ctx) {
    // fallback: rough estimate
    return {
      width: Math.ceil(lines.reduce((max, l) => Math.max(max, l.length), 0) * fontSize * 0.7 + PADDING_X),
      height: Math.ceil(lines.length * lineHeight + PADDING_Y),
    };
  }

  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  let maxW = 0;
  for (const line of lines) {
    maxW = Math.max(maxW, ctx.measureText(line).width);
  }

  return {
    width: Math.ceil(maxW + PADDING_X),
    height: Math.ceil(lines.length * lineHeight + PADDING_Y),
  };
}
