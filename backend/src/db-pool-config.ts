export function parseDbPoolMax(value: string | undefined): number {
  if (value === undefined) return 10;
  const max = Number(value);
  if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(max) || max <= 0) {
    throw new Error('DB_POOL_MAX must be a positive safe integer');
  }
  return max;
}
