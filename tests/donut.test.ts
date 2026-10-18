import { describe, expect, it } from "vitest";
import { donutPaths } from "@/lib/client/donut";

const box = { size: 200, outer: 96, inner: 56 };

describe("donutPaths", () => {
  it("gives each non-empty value one ring slice, in order", () => {
    const slices = donutPaths(
      [
        ["a", 3],
        ["b", 0],
        ["c", 1],
      ],
      box,
    );
    expect(slices.map((s) => s.key)).toEqual(["a", "c"]);
    expect(slices.every((s) => s.d.startsWith("M") && s.d.endsWith("Z"))).toBe(true);
  });

  it("uses the large-arc flag only for slices over half the ring", () => {
    const [big, small] = donutPaths(
      [
        ["big", 3],
        ["small", 1],
      ],
      box,
    );
    // Outer arc flags: "A rx ry rotation large-arc sweep x y".
    expect(big.d).toMatch(/A 96 96 0 1 1 /);
    expect(small.d).toMatch(/A 96 96 0 0 1 /);
  });

  it("draws a single value as a full ring (two half arcs, not a zero-length arc)", () => {
    const [only] = donutPaths([["a", 5]], box);
    expect(only.d.match(/A 96 96/g)).toHaveLength(2);
    expect(only.d.match(/A 56 56/g)).toHaveLength(2);
  });

  it("returns nothing when every value is zero", () => {
    expect(donutPaths([["a", 0]], box)).toEqual([]);
  });
});
