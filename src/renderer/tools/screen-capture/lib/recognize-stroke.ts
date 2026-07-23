export type Point = { x: number; y: number };

/** Distance from point to segment AB. */
function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * If the stroke is roughly straight, return endpoints `[start, end]`.
 * Used by pen/highlight snap — keeps the original kind, no shape conversion.
 */
export function straightenStroke(points: Point[]): [Point, Point] | null {
  if (points.length < 2) return null;
  const a = points[0];
  const b = points[points.length - 1];
  const chord = Math.hypot(b.x - a.x, b.y - a.y);
  if (chord < 16) return null;
  let maxDev = 0;
  for (const p of points) maxDev = Math.max(maxDev, distToSegment(p, a, b));
  if (maxDev > chord * 0.1) return null;
  return [
    { x: a.x, y: a.y },
    { x: b.x, y: b.y }
  ];
}

function sampleLine(x1: number, y1: number, x2: number, y2: number, n = 20): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return pts;
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/**
 * Runnable check: `RECOGNIZE_STROKE_CHECK=1 npx tsx src/renderer/tools/screen-capture/lib/recognize-stroke.ts`
 */
function assertStraightenStrokeSelfCheck(): void {
  const line = straightenStroke(sampleLine(10, 10, 200, 40));
  assert(line !== null, 'expected straight line');
  if (!line) return;
  assert(line[0].x === 10 && line[0].y === 10, `bad start ${JSON.stringify(line[0])}`);
  assert(line[1].x === 200 && line[1].y === 40, `bad end ${JSON.stringify(line[1])}`);

  const scribble = straightenStroke([
    { x: 0, y: 0 },
    { x: 40, y: 80 },
    { x: 10, y: 30 },
    { x: 90, y: 20 },
    { x: 50, y: 100 }
  ]);
  assert(scribble === null, `expected null for scribble, got ${JSON.stringify(scribble)}`);
}

if (typeof process !== 'undefined' && process.env.RECOGNIZE_STROKE_CHECK === '1') {
  assertStraightenStrokeSelfCheck();
  console.log('recognize-stroke: ok');
}
