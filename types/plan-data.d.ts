/**
 * Type definitions for PostgreSQL EXPLAIN plan data structures
 */

/**
 * Raw PostgreSQL EXPLAIN plan node (JSON output from EXPLAIN command)
 */
export interface PostgresPlanNode {
  'Node Type': string;
  'Total Cost'?: number;
  'Startup Cost'?: number;
  'Plan Rows'?: number;
  'Plan Width'?: number;
  'Actual Total Time'?: number;
  'Actual Startup Time'?: number;
  'Actual Rows'?: number;
  'Actual Loops'?: number;

  // Table/Index info
  'Relation Name'?: string;
  'Alias'?: string;
  'Schema'?: string;
  'Index Name'?: string;

  // Join info
  'Join Type'?: string;
  'Parent Relationship'?: string;
  'Hash Cond'?: string;
  'Join Filter'?: string;
  'Inner Unique'?: boolean;

  // Filter/Sort info
  'Filter'?: string;
  'Rows Removed by Filter'?: number;
  'Rows Removed by Join Filter'?: number;
  'Sort Key'?: string[];
  'Sort Method'?: string;
  'Sort Space Used'?: number;
  'Sort Space Type'?: string;

  // Aggregate info
  'Strategy'?: string;
  'Group Key'?: string[];
  'HashAgg Batches'?: number;
  'Peak Memory Usage'?: number;

  // Hash info
  'Hash Buckets'?: number;
  'Hash Batches'?: number;

  // Buffer statistics
  'Shared Hit Blocks'?: number;
  'Shared Read Blocks'?: number;
  'Shared Dirtied Blocks'?: number;
  'Shared Written Blocks'?: number;
  'Local Hit Blocks'?: number;
  'Local Read Blocks'?: number;
  'Temp Read Blocks'?: number;
  'Temp Written Blocks'?: number;

  // I/O Timing
  'I/O Read Time'?: number;
  'I/O Write Time'?: number;

  // Index scan details
  'Heap Fetches'?: number;
  'Exact Heap Blocks'?: number;
  'Lossy Heap Blocks'?: number;

  // Parallel execution
  'Workers Planned'?: number;
  'Workers Launched'?: number;

  // Output (VERBOSE mode)
  'Output'?: string[];

  // CTE info
  'Subplan Name'?: string;  // For CTE definitions (e.g., "CTE cte_name")
  'CTE Name'?: string;      // For CTE Scan nodes referencing a CTE

  // Child plans
  'Plans'?: PostgresPlanNode[];
}

/**
 * Root EXPLAIN plan data structure from PostgreSQL
 */
export interface PostgresPlanData {
  Plan: PostgresPlanNode;
  'Planning Time'?: number;
  'Execution Time'?: number;
  'Triggers'?: any[];
}

/**
 * Node details after enrichment
 */
export interface NodeDetails {
  // Core metrics
  cost: string;
  startupCost: string;
  planRows: number | string;
  actualRows: number | string;
  actualTime: string;
  startupTime: string;
  loops: number;

  // Table/Index info
  relation: string | null;
  alias: string | null;
  schema: string | null;
  indexName: string | null;

  // Join info
  joinType: string | null;
  hashCond: string | null;
  joinFilter: string | null;
  innerUnique: boolean | null;
  parentRelationship: string | null;

  // Filter/Sort info
  filter: string | null;
  sortKey: string | null;
  sortMethod: string | null;
  sortSpaceUsed: number | null;
  sortSpaceType: string | null;

  // Aggregate info
  strategy: string | null;
  groupKey: string | null;
  hashAggBatches: number | null;
  peakMemoryUsage: number | null;

  // Hash info
  hashBuckets: number | null;
  hashBatches: number | null;

  // Buffer info
  sharedHitBlocks: number;
  sharedReadBlocks: number;
  sharedDirtiedBlocks: number;
  sharedWrittenBlocks: number;
  localHitBlocks: number;
  localReadBlocks: number;
  tempReadBlocks: number;
  tempWrittenBlocks: number;

  // I/O Timing
  ioReadTime: number | null;
  ioWriteTime: number | null;

  // Filter selectivity
  rowsRemovedByFilter: number | null;
  rowsRemovedByJoinFilter: number | null;

  // Index info
  heapFetches: number | null;
  exactHeapBlocks: number | null;
  lossyHeapBlocks: number | null;

  // Parallel query info
  workersPlanned: number | null;
  workersLaunched: number | null;

  // Output columns
  output: string | null;

  // CTE info
  subplanName: string | null;  // For CTE definitions (e.g., "CTE cte_name")
  cteName: string | null;      // For CTE Scan nodes referencing a CTE

  // Performance indicators
  estimationAccuracy: number;
  estimationOff: boolean;
}

/**
 * Enriched node structure (output from node-enricher.js)
 */
export interface EnrichedNode {
  name: string;
  rawNode: PostgresPlanNode;
  details: NodeDetails;
  edgeLabel: string | null;
  children: EnrichedNode[];

  // NEW: Added for critical path and selection
  id?: string;
  isOnCriticalPath?: boolean;
}

/**
 * CTE relationship metadata
 */
export interface CTEMetadata {
  // Map of CTE name -> CTE definition info
  cteDefinitions: Map<string, {
    cteName: string;
    rootNodeId: string;
    rootNode: EnrichedNode;
  }>;

  // Array of CTE Scan references
  cteReferences: Array<{
    nodeId: string;
    cteName: string;
    targetCTENodeId: string;
  }>;
}

/**
 * Enhanced tree data structure with metadata
 */
export interface EnhancedTreeData {
  tree: EnrichedNode;
  criticalPath: EnrichedNode[];
  rootCost: number;
  rootTime: number;
  cteMetadata?: CTEMetadata;
}

/**
 * Data passed from plugin to WebView
 */
export interface VisualizationData {
  query: string;
  planData: PostgresPlanData;
  treeData: EnrichedNode;
  // NEW: Enhanced data
  criticalPath?: EnrichedNode[];
  rootCost?: number;
  rootTime?: number;
  cteMetadata?: CTEMetadata;
}
