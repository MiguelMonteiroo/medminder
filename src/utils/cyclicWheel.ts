export function wrapIndex(index: number, optionCount: number): number {
  if (optionCount <= 0) return 0;
  return ((index % optionCount) + optionCount) % optionCount;
}

export function getOptionIndex(
  visualIndex: number,
  optionCount: number
): number {
  return wrapIndex(visualIndex, optionCount);
}

export function getCenteredVisualIndex(
  optionIndex: number,
  optionCount: number,
  cycleCount: number
): number {
  if (optionCount <= 0 || cycleCount <= 0) return 0;
  const middleCycle = Math.floor(cycleCount / 2);
  return middleCycle * optionCount + wrapIndex(optionIndex, optionCount);
}

export function getRecenteredVisualIndex(
  visualIndex: number,
  optionCount: number,
  cycleCount: number
): number {
  if (optionCount <= 0 || cycleCount <= 0) return 0;

  const cycle = Math.floor(visualIndex / optionCount);
  if (cycle > 0 && cycle < cycleCount - 1) return visualIndex;

  return getCenteredVisualIndex(
    getOptionIndex(visualIndex, optionCount),
    optionCount,
    cycleCount
  );
}
