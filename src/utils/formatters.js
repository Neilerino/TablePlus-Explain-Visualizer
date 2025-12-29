export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  return Number(num).toFixed(decimals);
}

export function formatTime(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A';
  }
  return `${Number(ms).toFixed(3)} ms`;
}

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return 'N/A';
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMetric(value, unit = '') {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return unit ? `${value} ${unit}` : String(value);
}
