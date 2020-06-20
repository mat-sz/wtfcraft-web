const A = 3266489917;
const B = 374761393;
const C1 = 668265263;
const C2 = 2246822519;

function random(seed: number, x: number, y: number, z: number) {
  x = x * A + B + seed;
  x = (x << 17) | (x >> 15);

  x += y * A;

  x *= C1;
  x ^= x >> 15;
  x *= C2;
  x ^= x >> 13;
  x *= A;
  x ^= x >> 16;

  x += z * A;

  x *= C1;
  x ^= x >> 15;
  x *= C2;
  x ^= x >> 13;
  x *= A;
  x ^= x >> 16;

  return ((x * seed) & 0x00ffffff) * (2.0 / 0x1000000) - 1;
}

function lerp(a0: number, a1: number, w: number) {
  return (1.0 - w) * a0 + w * a1;
}

function grad(
  seed: number,
  ix: number,
  iy: number,
  iz: number,
  x: number,
  y: number
) {
  const rand = random(seed, ix, iy, iz);
  const dx = x - ix;
  const dy = y - iy;

  return dx * rand + dy * rand;
}

export function terrain(seed: number, x: number, y: number, z: number) {
  x /= 6;
  y /= 6;
  z /= 6;

  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;
  const z0 = Math.floor(z);
  const z1 = z0 + 1;

  let n0: number, n1: number, ix0: number, ix1: number, iy0: number;

  n0 = grad(seed, x0, y0, z0, x, y);
  n1 = grad(seed, x1, y0, z0, x, y);
  ix0 = lerp(n0, n1, x - x0);

  n0 = grad(seed, x0, y1, z1, x, y);
  n1 = grad(seed, x1, y1, z1, x, y);
  ix1 = lerp(n0, n1, x - x0);

  iy0 = lerp(ix0, ix1, y - y0);

  return lerp(ix1, iy0, z - z0);
}
