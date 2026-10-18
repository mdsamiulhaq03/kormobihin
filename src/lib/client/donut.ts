// SVG paths for a donut chart. Replaces a 90 KB (gzipped) chart library that was only
// used to draw one ring on the dashboard.

type Box = { size: number; outer: number; inner: number };

export type DonutSlice<K extends string> = { key: K; d: string };

const round = (n: number) => Math.round(n * 100) / 100;

/** Point on a circle; angle 0 is 12 o'clock, growing clockwise. */
function point(center: number, radius: number, angle: number) {
  return `${round(center + radius * Math.sin(angle))} ${round(center - radius * Math.cos(angle))}`;
}

/** One ring slice from angle a0 to a1 (radians). */
function slice({ size, outer, inner }: Box, a0: number, a1: number): string {
  const c = size / 2;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${point(c, outer, a0)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(c, outer, a1)}`,
    `L ${point(c, inner, a1)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(c, inner, a0)}`,
    "Z",
  ].join(" ");
}

/** A full ring: SVG can't draw a 360° arc, so it is two half arcs on each edge. */
function ring({ size, outer, inner }: Box): string {
  const c = size / 2;
  return [
    `M ${point(c, outer, 0)}`,
    `A ${outer} ${outer} 0 1 1 ${point(c, outer, Math.PI)}`,
    `A ${outer} ${outer} 0 1 1 ${point(c, outer, 0)}`,
    `M ${point(c, inner, 0)}`,
    `A ${inner} ${inner} 0 1 0 ${point(c, inner, Math.PI)}`,
    `A ${inner} ${inner} 0 1 0 ${point(c, inner, 0)}`,
    "Z",
  ].join(" ");
}

export function donutPaths<K extends string>(
  values: readonly (readonly [K, number])[],
  box: Box,
): DonutSlice<K>[] {
  const shown = values.filter(([, value]) => value > 0);
  const total = shown.reduce((sum, [, value]) => sum + value, 0);
  if (total === 0) return [];
  if (shown.length === 1) return [{ key: shown[0][0], d: ring(box) }];

  let angle = 0;
  return shown.map(([key, value]) => {
    const start = angle;
    angle += (value / total) * 2 * Math.PI;
    return { key, d: slice(box, start, angle) };
  });
}
