export function calculateEstimationAccuracy(planRows, actualRows) {
  if (!planRows || planRows === 0) return 1.0;
  return actualRows / planRows;
}

export function isEstimationOff(accuracy, threshold = 2.0) {
  return accuracy < (1 / threshold) || accuracy > threshold;
}

export function calculateCacheHitRate(hitBlocks, readBlocks) {
  const total = hitBlocks + readBlocks;
  if (total === 0) return 0;
  return (hitBlocks / total) * 100;
}

export function calculateSelectivity(actualRows, removedRows) {
  const totalRows = actualRows + removedRows;
  if (totalRows === 0) return 0;
  return (actualRows / totalRows) * 100;
}
