/**
 * Visualization Controller
 * Orchestrates the visualization rendering and user interactions
 */

import { ITreeRenderer } from '../../application/interfaces/i-tree-renderer';
import { IGridRenderer } from '../../application/interfaces/i-grid-renderer';
import { IEventBus } from '../../application/interfaces/i-event-bus';
import { ViewStateManager } from '../../application/services/view-state-manager';
import { SelectNodeUseCase } from '../../application/use-cases/select-node.use-case';
import { ToggleViewUseCase } from '../../application/use-cases/toggle-view.use-case';
import { ToggleCriticalPathUseCase } from '../../application/use-cases/toggle-critical-path.use-case';
import { ViewChangedEvent, NodeSelectedEvent, CriticalPathToggledEvent } from '../../application/events/application-events';
import { EnrichedNode, PostgresPlanData, CTEMetadata } from '../../../../types/plan-data';
import { GridAdapter } from '../../services/grid-adapter';
import { ViewType } from '../../domain/entities/visualization-state.entity';

export interface VisualizationData {
  treeData: EnrichedNode;
  planData: PostgresPlanData;
  criticalPath: EnrichedNode[];
  query: string;
  cteMetadata?: CTEMetadata;
}

export class VisualizationController {
  private visualizationData: VisualizationData | null = null;
  private onNodeSelectCallback: ((node: any) => void) | null = null;

  constructor(
    private treeRenderer: ITreeRenderer,
    private gridRenderer: IGridRenderer,
    private stateManager: ViewStateManager,
    private selectNodeUseCase: SelectNodeUseCase,
    private toggleViewUseCase: ToggleViewUseCase,
    private toggleCriticalPathUseCase: ToggleCriticalPathUseCase,
    private eventBus: IEventBus
  ) {
    this.subscribeToEvents();
  }

  /**
   * Initialize the visualization with data
   */
  initialize(data: VisualizationData, onNodeSelect: (node: any) => void): void {
    this.visualizationData = data;
    this.onNodeSelectCallback = onNodeSelect;

    // Render initial view based on state
    this.renderCurrentView();
  }

  /**
   * Handle view toggle from UI
   */
  handleViewToggle(viewType: ViewType): void {
    this.toggleViewUseCase.execute(viewType);
  }

  /**
   * Handle node click
   */
  handleNodeClick(nodeId: string): void {
    this.selectNodeUseCase.execute(nodeId);
  }

  /**
   * Handle critical path toggle
   */
  handleCriticalPathToggle(): void {
    this.toggleCriticalPathUseCase.execute();
  }

  /**
   * Subscribe to application events
   */
  private subscribeToEvents(): void {
    this.eventBus.subscribe(ViewChangedEvent, (event) => {
      this.renderCurrentView();
    });

    this.eventBus.subscribe(NodeSelectedEvent, (event) => {
      this.highlightNode(event.nodeId);
      if (this.onNodeSelectCallback && this.visualizationData) {
        // Find node data and call callback
        const nodeData = this.findNodeById(event.nodeId, this.visualizationData.treeData);
        if (nodeData) {
          this.onNodeSelectCallback({ data: nodeData });
        }
      }
    });

    this.eventBus.subscribe(CriticalPathToggledEvent, (event) => {
      this.updateCriticalPathDisplay(event.enabled);
    });
  }

  /**
   * Render the current view based on state
   */
  private renderCurrentView(): void {
    if (!this.visualizationData) return;

    const currentView = this.stateManager.currentView;

    if (currentView === 'graph') {
      this.renderGraphView();
    } else {
      this.renderGridView();
    }
  }

  /**
   * Render graph view
   */
  private renderGraphView(): void {
    if (!this.visualizationData) return;

    const treeContainer = document.getElementById('tree-container');
    const gridContainer = document.getElementById('grid-container');
    const zoomControls = document.querySelector('.zoom-controls');

    if (!treeContainer) return;

    // Show graph, hide grid
    treeContainer.style.display = 'flex';
    if (gridContainer) gridContainer.style.display = 'none';
    if (zoomControls) (zoomControls as HTMLElement).style.display = 'flex';

    // Clear and render tree
    treeContainer.innerHTML = '';

    this.treeRenderer.render({
      treeData: this.visualizationData.treeData,
      container: treeContainer,
      onNodeClick: (nodeId) => this.handleNodeClick(nodeId),
      cteMetadata: this.visualizationData.cteMetadata
    });

    // Initialize critical path on tree renderer (after render, when SVG is ready)
    if (this.visualizationData.criticalPath && this.visualizationData.criticalPath.length > 0) {
      if (this.treeRenderer instanceof Object && 'initializeCriticalPath' in this.treeRenderer) {
        (this.treeRenderer as any).initializeCriticalPath(this.visualizationData.criticalPath);
      }
    }

    // Apply critical path if enabled
    if (this.stateManager.isCriticalPathEnabled && this.visualizationData.criticalPath) {
      this.updateCriticalPathDisplay(true);
    }
  }

  /**
   * Render grid view
   */
  private renderGridView(): void {
    if (!this.visualizationData) return;

    const treeContainer = document.getElementById('tree-container');
    const gridContainer = document.getElementById('grid-container');
    const zoomControls = document.querySelector('.zoom-controls');

    if (!gridContainer) return;

    // Hide graph, show grid
    if (treeContainer) treeContainer.style.display = 'none';
    gridContainer.style.display = 'flex';
    if (zoomControls) (zoomControls as HTMLElement).style.display = 'none';

    // Transform data for grid
    const gridConfig = GridAdapter.toGridData(
      this.visualizationData.treeData,
      this.visualizationData.planData,
      this.visualizationData.cteMetadata
    );

    // Render grid
    this.gridRenderer.render(gridConfig, (rowData: any) => {
      if (this.onNodeSelectCallback) {
        this.onNodeSelectCallback({ data: rowData._node });
      }
    });
  }

  /**
   * Highlight a node in the current view
   */
  private highlightNode(nodeId: string): void {
    const currentView = this.stateManager.currentView;

    if (currentView === 'graph') {
      this.treeRenderer.highlightNode(nodeId);
    } else {
      this.gridRenderer.selectNode(nodeId);
    }
  }

  /**
   * Update critical path display
   */
  private updateCriticalPathDisplay(enabled: boolean): void {
    if (!this.visualizationData?.criticalPath) return;

    if (this.treeRenderer instanceof Object && 'toggleCriticalPath' in this.treeRenderer) {
      (this.treeRenderer as any).toggleCriticalPath(
        this.visualizationData.criticalPath,
        enabled
      );
    }
  }

  /**
   * Find node by ID in tree structure
   */
  private findNodeById(nodeId: string, node: EnrichedNode): EnrichedNode | null {
    if (node.id === nodeId) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(nodeId, child);
        if (found) return found;
      }
    }

    return null;
  }
}
