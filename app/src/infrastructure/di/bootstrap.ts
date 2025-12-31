/**
 * Application Bootstrap
 * Wires up all dependencies and initializes the application
 */

import { DIContainer } from './container';
import { EventBus } from '../events/event-bus';
import { LocalStorageAdapter } from '../persistence/local-storage.adapter';
import { ViewStateManager } from '../../application/services/view-state-manager';
import { SelectNodeUseCase } from '../../application/use-cases/select-node.use-case';
import { ToggleViewUseCase } from '../../application/use-cases/toggle-view.use-case';
import { ToggleCriticalPathUseCase } from '../../application/use-cases/toggle-critical-path.use-case';
import { D3TreeRenderer } from '../renderers/d3-tree.renderer';
import { GridRenderer } from '../renderers/grid-renderer';
import { VisualizationState } from '../../domain/entities/visualization-state.entity';
import { VisualizationController } from '../../presentation/controllers/visualization.controller';
import { SidebarController } from '../../presentation/controllers/sidebar.controller';

/**
 * Bootstrap the application with dependency injection
 */
export function bootstrapApplication(d3Instance: any): DIContainer {
  const container = new DIContainer();

  // Infrastructure - Singletons
  container.registerSingleton('eventBus', () => new EventBus());

  container.registerSingleton('stateStore', () =>
    new LocalStorageAdapter<VisualizationState>('pgexplain-state')
  );

  container.registerSingleton('d3', () => d3Instance);

  // Application Services - Singletons
  container.registerSingleton('viewStateManager', () =>
    new ViewStateManager(
      container.resolve('eventBus'),
      container.resolve('stateStore')
    )
  );

  // Use Cases
  container.register('selectNodeUseCase', () =>
    new SelectNodeUseCase(container.resolve('viewStateManager'))
  );

  container.register('toggleViewUseCase', () =>
    new ToggleViewUseCase(container.resolve('viewStateManager'))
  );

  container.register('toggleCriticalPathUseCase', () =>
    new ToggleCriticalPathUseCase(container.resolve('viewStateManager'))
  );

  // Renderers
  container.register('treeRenderer', () =>
    new D3TreeRenderer(container.resolve('d3'))
  );

  container.register('gridRenderer', () =>
    new GridRenderer(
      document.getElementById('grid-container')!,
      container.resolve('viewStateManager')
    )
  );

  // Controllers
  container.registerSingleton('visualizationController', () =>
    new VisualizationController(
      container.resolve('treeRenderer'),
      container.resolve('gridRenderer'),
      container.resolve('viewStateManager'),
      container.resolve('selectNodeUseCase'),
      container.resolve('toggleViewUseCase'),
      container.resolve('toggleCriticalPathUseCase'),
      container.resolve('eventBus')
    )
  );

  container.registerSingleton('sidebarController', () => {
    const viewManager = container.resolve<ViewStateManager>('viewStateManager');
    return new SidebarController(
      container.resolve('eventBus'),
      () => viewManager.saveState()
    );
  });

  return container;
}
