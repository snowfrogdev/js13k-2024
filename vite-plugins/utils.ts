export function printJs13kStats(prefix: string, size: number): void {
  const percent = ((size / 13_312) * 100).toFixed(2);
  console.log(`${prefix} size: ${size} bytes (${percent}% of 13 KB)`);
}

export function addDefaultValues<T extends Record<string, any>>(a: T | undefined, b: T): T {
  if (!a) {
    return b;
  }
  for (const [k, v] of Object.entries(b) as [keyof T, any][]) {
    if (a[k] === undefined) {
      a[k] = v;
    } else if (isObject(v) && isObject(a[k])) {
      a[k] = addDefaultValues(a[k], v);
    }
  }
  return a;
}

export function isObject(item: unknown): boolean {
  return !!item && typeof item === "object";
}
