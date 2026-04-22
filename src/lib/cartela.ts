const FREE = 0;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(values: number[], seed: number): number[] {
  const rng = mulberry32(seed);
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deterministically maps a cartela number (1..200) to a standard 75-ball 5x5 card.
 */
export function generateCardFromCartela(cartelaNumber: number): number[] {
  const normalized = Math.max(1, Math.min(200, Math.trunc(cartelaNumber) || 1));
  const ranges: Array<[number, number]> = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  const cols = ranges.map(([lo, hi], colIndex) => {
    const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    return seededShuffle(pool, normalized * 100 + colIndex + 1).slice(0, 5);
  });

  const flat = new Array<number>(25).fill(0);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      flat[row * 5 + col] = cols[col][row];
    }
  }
  flat[12] = FREE;
  return flat;
}

export function splitCards(combined: number[]): number[][] {
  if (!combined?.length) return [];
  const cards: number[][] = [];
  for (let i = 0; i < combined.length; i += 25) {
    const chunk = combined.slice(i, i + 25);
    if (chunk.length === 25) cards.push(chunk);
  }
  return cards;
}
