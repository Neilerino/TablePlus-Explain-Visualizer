/**
 * Base class for all EXPLAIN node entities
 * Encapsulates common properties and behavior for all node types
 */

export abstract class BaseExplainNode {
  constructor(protected rawData: any) {}

  /**
   * Node type identifier (e.g., "Seq Scan", "Index Scan")
   */
  abstract get nodeType(): string;

  // ============================================
  // Common Properties (all nodes have these)
  // ============================================

  get id(): string {
    return this.rawData.id || this.rawData.data?.id || '';
  }

  get name(): string {
    return this.rawData.name || this.rawData.data?.name || '';
  }

  get details(): any {
    return this.rawData.details || this.rawData.data?.details || {};
  }

  // Cost & Timing
  get cost(): number {
    return this.details.cost || 0;
  }

  get startupCost(): number {
    return this.details.startupCost || 0;
  }

  get actualTime(): number {
    return this.details.actualTime || 0;
  }

  get startupTime(): number {
    return this.details.startupTime || 0;
  }

  // Rows
  get planRows(): number {
    return this.details.planRows || 0;
  }

  get actualRows(): number {
    return this.details.actualRows || 0;
  }

  get loops(): number {
    return this.details.loops || 1;
  }

  // Estimation accuracy
  get estimationAccuracy(): number | null {
    if (this.planRows === 0) return null;
    return this.actualRows / this.planRows;
  }

  get isEstimationOff(): boolean {
    const accuracy = this.estimationAccuracy;
    if (accuracy === null) return false;
    // Consider estimation off if more than 20% difference
    return accuracy < 0.8 || accuracy > 1.2;
  }

  // Output
  get output(): string[] | null {
    return this.details.output || null;
  }

  // Parallel execution
  get workersPlanned(): number | null {
    return this.details.workersPlanned || null;
  }

  get workersLaunched(): number | null {
    return this.details.workersLaunched || null;
  }

  // Buffers
  get sharedHitBlocks(): number {
    return this.details.sharedHitBlocks || 0;
  }

  get sharedReadBlocks(): number {
    return this.details.sharedReadBlocks || 0;
  }

  get sharedDirtiedBlocks(): number {
    return this.details.sharedDirtiedBlocks || 0;
  }

  get sharedWrittenBlocks(): number {
    return this.details.sharedWrittenBlocks || 0;
  }

  get localHitBlocks(): number {
    return this.details.localHitBlocks || 0;
  }

  get localReadBlocks(): number {
    return this.details.localReadBlocks || 0;
  }

  get tempReadBlocks(): number {
    return this.details.tempReadBlocks || 0;
  }

  get tempWrittenBlocks(): number {
    return this.details.tempWrittenBlocks || 0;
  }

  // I/O Timing
  get ioReadTime(): number | null {
    return this.details.ioReadTime !== undefined ? this.details.ioReadTime : null;
  }

  get ioWriteTime(): number | null {
    return this.details.ioWriteTime !== undefined ? this.details.ioWriteTime : null;
  }

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Calculate cache hit rate for buffer operations
   */
  get cacheHitRate(): number | null {
    const totalAccess = this.sharedHitBlocks + this.sharedReadBlocks;
    if (totalAccess === 0) return null;
    return (this.sharedHitBlocks / totalAccess) * 100;
  }

  /**
   * Check if this node has buffer statistics
   */
  get hasBufferStats(): boolean {
    return this.sharedHitBlocks > 0 ||
           this.sharedReadBlocks > 0 ||
           this.sharedDirtiedBlocks > 0 ||
           this.sharedWrittenBlocks > 0 ||
           this.localHitBlocks > 0 ||
           this.localReadBlocks > 0 ||
           this.tempReadBlocks > 0 ||
           this.tempWrittenBlocks > 0;
  }

  /**
   * Check if this node has I/O timing information
   */
  get hasIOTiming(): boolean {
    return this.ioReadTime !== null || this.ioWriteTime !== null;
  }

  /**
   * Get raw data (for debugging or advanced use)
   */
  getRawData(): any {
    return this.rawData;
  }

  /**
   * Get any detail property by key
   * Useful for accessing node-specific properties
   */
  getDetail(key: string): any {
    return this.details[key];
  }

  /**
   * Check if a detail property exists
   */
  hasDetail(key: string): boolean {
    return this.details[key] !== undefined;
  }
}
