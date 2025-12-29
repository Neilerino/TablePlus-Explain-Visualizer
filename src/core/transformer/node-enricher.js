import { calculateEstimationAccuracy, isEstimationOff } from './metrics.js';

export function enrichNode(node) {
  const planRows = node['Plan Rows'] || 0;
  const actualRows = node['Actual Rows'] || 0;
  const estimationAccuracy = calculateEstimationAccuracy(planRows, actualRows);

  return {
    name: node['Node Type'] || 'Unknown',
    rawNode: node,
    details: {
      cost: node['Total Cost'] ? node['Total Cost'].toFixed(2) : 'N/A',
      startupCost: node['Startup Cost'] ? node['Startup Cost'].toFixed(2) : 'N/A',
      planRows: node['Plan Rows'] || 'N/A',
      actualRows: node['Actual Rows'] || 'N/A',
      actualTime: node['Actual Total Time'] ? node['Actual Total Time'].toFixed(3) : 'N/A',
      startupTime: node['Actual Startup Time'] ? node['Actual Startup Time'].toFixed(3) : 'N/A',

      // Table/Index info
      relation: node['Relation Name'] || null,
      alias: node['Alias'] || null,
      schema: node['Schema'] || null,
      indexName: node['Index Name'] || null,

      // Join info
      joinType: node['Join Type'] || null,
      hashCond: node['Hash Cond'] || null,
      joinFilter: node['Join Filter'] || null,
      innerUnique: node['Inner Unique'] || null,
      parentRelationship: node['Parent Relationship'] || null,

      // Filter/Sort info
      filter: node['Filter'] || null,
      sortKey: node['Sort Key'] ? node['Sort Key'].join(', ') : null,
      sortMethod: node['Sort Method'] || null,
      sortSpaceUsed: node['Sort Space Used'] || null,
      sortSpaceType: node['Sort Space Type'] || null,

      // Aggregate info
      strategy: node['Strategy'] || null,
      groupKey: node['Group Key'] ? node['Group Key'].join(', ') : null,
      hashAggBatches: node['HashAgg Batches'] || null,
      peakMemoryUsage: node['Peak Memory Usage'] || null,

      // Hash info
      hashBuckets: node['Hash Buckets'] || null,
      hashBatches: node['Hash Batches'] || null,

      // Buffer info
      sharedHitBlocks: node['Shared Hit Blocks'] || 0,
      sharedReadBlocks: node['Shared Read Blocks'] || 0,
      sharedDirtiedBlocks: node['Shared Dirtied Blocks'] || 0,
      sharedWrittenBlocks: node['Shared Written Blocks'] || 0,
      localHitBlocks: node['Local Hit Blocks'] || 0,
      localReadBlocks: node['Local Read Blocks'] || 0,
      tempReadBlocks: node['Temp Read Blocks'] || 0,
      tempWrittenBlocks: node['Temp Written Blocks'] || 0,

      // I/O Timing
      ioReadTime: node['I/O Read Time'] || null,
      ioWriteTime: node['I/O Write Time'] || null,

      // Filter selectivity
      rowsRemovedByFilter: node['Rows Removed by Filter'] || null,
      rowsRemovedByJoinFilter: node['Rows Removed by Join Filter'] || null,

      // Index info
      heapFetches: node['Heap Fetches'] || null,
      exactHeapBlocks: node['Exact Heap Blocks'] || null,
      lossyHeapBlocks: node['Lossy Heap Blocks'] || null,

      // Parallel query info
      workersPlanned: node['Workers Planned'] || null,
      workersLaunched: node['Workers Launched'] || null,

      // Output columns (VERBOSE)
      output: node['Output'] ? node['Output'].join(', ') : null,

      // Performance indicators
      estimationAccuracy: estimationAccuracy,
      estimationOff: isEstimationOff(estimationAccuracy),
      loops: node['Actual Loops'] || 1
    }
  };
}
