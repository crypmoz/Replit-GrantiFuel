/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects external API calls from cascading failures and provides graceful
 * fallback mechanisms when services are unavailable.
 */

enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation, requests allowed
  OPEN = 'OPEN',           // Failure threshold exceeded, requests blocked
  HALF_OPEN = 'HALF_OPEN'  // Testing if service is recovered
}

interface CircuitBreakerOptions {
  failureThreshold: number;       // Number of failures before opening circuit
  resetTimeout: number;           // Time in ms to wait before trying half-open state
  timeoutDuration: number;        // Time in ms to wait for service response before timeout
  monitorInterval?: number;       // Time in ms to check circuit state
  fallbackFn?: (...args: any[]) => any;  // Function to call when circuit is open
}

const defaultOptions: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000,  // 30 seconds
  timeoutDuration: 10000,  // 10 seconds
  monitorInterval: 60000,  // 1 minute
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private monitorTimer: NodeJS.Timeout | null = null;
  private options: CircuitBreakerOptions;
  private lastError: Error | null = null;
  private successCount: number = 0;
  private readonly serviceName: string;
  private lastStateChange: Date = new Date();

  constructor(serviceName: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.serviceName = serviceName;
    this.options = { ...defaultOptions, ...options };
    
    // Start the monitor if enabled
    if (this.options.monitorInterval) {
      this.startMonitoring();
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // If fallback function is provided, use it
      if (this.options.fallbackFn) {
        console.log(`[CircuitBreaker:${this.serviceName}] Circuit OPEN, using fallback`);
        return this.options.fallbackFn(...args);
      }
      
      // Otherwise, throw the last error
      const error = this.lastError || new Error(`Service ${this.serviceName} is unavailable`);
      error.name = 'CircuitOpenError';
      throw error;
    }

    // If circuit is half-open, only allow one test request
    if (this.state === CircuitState.HALF_OPEN) {
      console.log(`[CircuitBreaker:${this.serviceName}] Circuit HALF-OPEN, testing service`);
    }

    // Execute the function with a timeout
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request to ${this.serviceName} timed out after ${this.options.timeoutDuration}ms`));
        }, this.options.timeoutDuration);
      });

      // Race between the actual function and the timeout
      const result = await Promise.race([
        fn(...args),
        timeoutPromise
      ]) as T;

      // Request succeeded
      this.onSuccess();
      return result;
    } catch (error: any) {
      // Request failed
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // If we've had enough successes in half-open state, close the circuit
      if (this.successCount >= 2) {  // Require 2 successful requests to close circuit
        this.reset();
        console.log(`[CircuitBreaker:${this.serviceName}] Circuit CLOSED after successful test`);
      }
    } else {
      // Reset failure count on successful closed-circuit operation
      this.failureCount = 0;
      this.lastError = null;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.lastError = error;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // If failed during half-open test, go back to open state
      this.tripBreaker();
      console.log(`[CircuitBreaker:${this.serviceName}] Test failed, circuit OPEN`);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      // If we've reached the failure threshold, open the circuit
      if (this.failureCount >= this.options.failureThreshold) {
        this.tripBreaker();
        console.log(`[CircuitBreaker:${this.serviceName}] Failure threshold reached, circuit OPEN`);
      }
    }
  }

  /**
   * Trip the circuit breaker (change to OPEN state)
   */
  private tripBreaker(): void {
    this.state = CircuitState.OPEN;
    this.lastStateChange = new Date();
    this.successCount = 0;
    
    // Set timer to try half-open after resetTimeout
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    this.resetTimer = setTimeout(() => {
      console.log(`[CircuitBreaker:${this.serviceName}] Reset timeout elapsed, circuit HALF-OPEN`);
      this.state = CircuitState.HALF_OPEN;
      this.lastStateChange = new Date();
    }, this.options.resetTimeout);
  }

  /**
   * Reset the circuit breaker to its initial closed state
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.lastStateChange = new Date();
    this.failureCount = 0;
    this.successCount = 0;
    this.lastError = null;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Start monitoring the circuit breaker
   */
  private startMonitoring(): void {
    this.monitorTimer = setInterval(() => {
      const stateAge = Date.now() - this.lastStateChange.getTime();
      
      console.log(`[CircuitBreaker:${this.serviceName}] Status: ${this.state}, Failures: ${this.failureCount}, Age: ${stateAge}ms`);
    }, this.options.monitorInterval);
  }

  /**
   * Stop monitoring the circuit breaker
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Get the current state of the circuit
   */
  getState(): { state: CircuitState; failureCount: number; lastError: Error | null } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastError: this.lastError
    };
  }
}