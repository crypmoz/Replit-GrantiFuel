/**
 * Memory Manager
 * 
 * This utility helps with proactive memory management to improve application stability.
 * It periodically forces garbage collection (when --expose-gc flag is enabled) and
 * logs memory usage statistics for monitoring.
 */

export class MemoryManager {
  private static instance: MemoryManager;
  private gcInterval: NodeJS.Timeout | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private memoryThreshold: number = 0.85; // 85% of available heap
  private isNodeFlagEnabled: boolean = false;

  private constructor() {
    // Check if expose-gc is available
    this.isNodeFlagEnabled = typeof global.gc === 'function';
    
    if (!this.isNodeFlagEnabled) {
      console.warn(
        '[MemoryManager] Forced garbage collection not available. ' +
        'To enable, start Node.js with --expose-gc flag.'
      );
    }
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Start periodic memory management
   * @param gcIntervalMs Interval in ms between garbage collection (default: 5 minutes)
   * @param checkIntervalMs Interval in ms between memory checks (default: 1 minute)
   */
  public startMemoryManagement(gcIntervalMs = 5 * 60 * 1000, checkIntervalMs = 60 * 1000): void {
    // Stop any existing intervals
    this.stopMemoryManagement();
    
    // Start garbage collection interval if available
    if (this.isNodeFlagEnabled) {
      this.gcInterval = setInterval(() => {
        this.forceGarbageCollection();
      }, gcIntervalMs);
      
      console.log(`[MemoryManager] Scheduled garbage collection every ${gcIntervalMs / 1000} seconds`);
    }
    
    // Start memory check interval
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, checkIntervalMs);
    
    console.log(`[MemoryManager] Scheduled memory checks every ${checkIntervalMs / 1000} seconds`);
    
    // Run initial check and GC
    this.checkMemoryUsage();
    if (this.isNodeFlagEnabled) {
      this.forceGarbageCollection();
    }
  }

  /**
   * Stop all memory management intervals
   */
  public stopMemoryManagement(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    
    console.log('[MemoryManager] Memory management stopped');
  }

  /**
   * Force garbage collection if the flag is enabled
   */
  public forceGarbageCollection(): void {
    if (this.isNodeFlagEnabled) {
      console.log('[MemoryManager] Forcing garbage collection...');
      
      const memBefore = process.memoryUsage();
      
      try {
        // Using the global.gc function which is exposed when --expose-gc flag is used
        (global as any).gc();
        
        const memAfter = process.memoryUsage();
        const freed = (memBefore.heapUsed - memAfter.heapUsed) / 1024 / 1024;
        
        console.log(`[MemoryManager] Garbage collection complete. Freed ${freed.toFixed(2)} MB`);
      } catch (error) {
        console.error('[MemoryManager] Error during garbage collection:', error);
      }
    }
  }

  /**
   * Check current memory usage and log it
   * Forces GC if usage is above threshold
   */
  public checkMemoryUsage(): void {
    try {
      const memoryUsage = process.memoryUsage();
      
      // Calculate usage percentages
      const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      // Log memory statistics
      console.log('[MemoryManager] Memory usage:', {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
        heapUsedPercentage: `${(heapUsedPercentage * 100).toFixed(2)}%`
      });
      
      // Force GC if usage is above threshold
      if (heapUsedPercentage > this.memoryThreshold && this.isNodeFlagEnabled) {
        console.log(`[MemoryManager] Memory usage above threshold (${(heapUsedPercentage * 100).toFixed(2)}% > ${(this.memoryThreshold * 100).toFixed(2)}%), forcing garbage collection`);
        this.forceGarbageCollection();
      }
    } catch (error) {
      console.error('[MemoryManager] Error checking memory usage:', error);
    }
  }

  /**
   * Set memory threshold percentage (0-1) for automatic GC
   */
  public setMemoryThreshold(threshold: number): void {
    if (threshold > 0 && threshold < 1) {
      this.memoryThreshold = threshold;
      console.log(`[MemoryManager] Memory threshold set to ${(threshold * 100).toFixed(2)}%`);
    } else {
      console.error('[MemoryManager] Invalid memory threshold. Must be between 0 and 1');
    }
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();