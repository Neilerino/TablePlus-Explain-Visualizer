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
import { SidebarComponent } from '../../presentation/components/sidebar.component';
import { NodeDetailsController } from '../../presentation/controllers/node-details.controller';
import { NodeDetailsComponent } from '../../presentation/components/node-details.component';
import { ViewToggleController } from '../../presentation/controllers/view-toggle.controller';
import { ViewToggleComponent } from '../../presentation/components/view-toggle.component';
import { CriticalPathToggleController } from '../../presentation/controllers/critical-path-toggle.controller';
import { CriticalPathToggleComponent } from '../../presentation/components/critical-path-toggle.component';

/**
 * Bootstrap the application with dependency injection
 */
export function bootstrapApplication(d3Instance: any, hljsInstance: any): DIContainer {
  const container = new DIContainer();

  // Infrastructure - Singletons
  container.registerSingleton('eventBus', () => new EventBus());

  container.registerSingleton('stateStore', () =>
    new LocalStorageAdapter<VisualizationState>('pgexplain-state')
  );

  container.registerSingleton('d3', () => d3Instance);

  container.registerSingleton('hljs', () => hljsInstance);

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

  // Sidebar Controllers - Two instances (left and right)
  container.registerSingleton('leftSidebarController', () => {
    const leftSidebarElement = document.getElementById('leftSidebar') as HTMLElement;
    if (!leftSidebarElement) {
      throw new Error('Left sidebar element not found');
    }

    const leftSidebarComponent = new SidebarComponent(leftSidebarElement, 'left');
    const viewManager = container.resolve<ViewStateManager>('viewStateManager');

    return new SidebarController(
      leftSidebarComponent,
      container.resolve('eventBus'),
      () => viewManager.saveState()
    );
  });

  container.registerSingleton('rightSidebarController', () => {
    const rightSidebarElement = document.getElementById('rightSidebar') as HTMLElement;
    if (!rightSidebarElement) {
      throw new Error('Right sidebar element not found');
    }

    const rightSidebarComponent = new SidebarComponent(rightSidebarElement, 'right');
    const viewManager = container.resolve<ViewStateManager>('viewStateManager');

    return new SidebarController(
      rightSidebarComponent,
      container.resolve('eventBus'),
      () => viewManager.saveState()
    );
  });

  // Node Details Controller
  container.registerSingleton('nodeDetailsController', () => {
    const nodeDetailsElement = document.getElementById('nodeDetails') as HTMLElement;
    if (!nodeDetailsElement) {
      throw new Error('Node details element not found');
    }

    const nodeDetailsComponent = new NodeDetailsComponent(nodeDetailsElement);

    return new NodeDetailsController(
      nodeDetailsComponent,
      container.resolve('hljs')
    );
  });

  // View Toggle Controller
  container.registerSingleton('viewToggleController', () => {
    const viewToggleElement = document.getElementById('viewToggleContainer') as HTMLElement;
    if (!viewToggleElement) {
      throw new Error('View toggle container element not found');
    }

    const viewToggleComponent = new ViewToggleComponent(viewToggleElement);

    return new ViewToggleController(
      viewToggleComponent,
      container.resolve('toggleViewUseCase'),
      container.resolve('viewStateManager'),
      container.resolve('eventBus')
    );
  });

  // Critical Path Toggle Controller
  container.registerSingleton('criticalPathToggleController', () => {
    const statsContainer = document.getElementById('statsContainer') as HTMLElement;
    if (!statsContainer) {
      throw new Error('Stats container element not found');
    }

    // Component will be created with initial count of 0, updated later
    const criticalPathComponent = new CriticalPathToggleComponent(statsContainer, 0);

    return new CriticalPathToggleController(
      criticalPathComponent,
      container.resolve('toggleCriticalPathUseCase'),
      container.resolve('viewStateManager'),
      container.resolve('eventBus')
    );
  });

  return container;
}
