/**
 * Dependency Injection Container
 * Simple DI container for managing application dependencies
 */

type Factory<T> = () => T;

export class DIContainer {
  private services = new Map<string, Factory<any>>();
  private singletons = new Map<string, any>();

  /**
   * Register a service factory
   */
  register<T>(key: string, factory: Factory<T>, singleton: boolean = false): void {
    this.services.set(key, factory);
    if (singleton) {
      // Mark for singleton creation on first resolve
      this.singletons.set(key, null);
    }
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(key: string, factory: Factory<T>): void {
    this.register(key, factory, true);
  }

  /**
   * Resolve a service by key
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service "${key}" not registered in DI container`);
    }

    // Check if it's a singleton
    if (this.singletons.has(key)) {
      let instance = this.singletons.get(key);
      if (!instance) {
        instance = factory();
        this.singletons.set(key, instance);
      }
      return instance;
    }

    return factory();
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}
