/**
 * Node Details Controller
 * Handles node selection events and coordinates detail display
 * Uses NodeService and Factory pattern for type-safe rendering
 */

import { NodeService } from '../../domain/services/node.service';
import { NodeDetailsComponentFactory } from '../factories/node-details-component.factory';
import { GenericNodeDetailsComponent } from '../components/node-details/generic-node-details.component';

export class NodeDetailsController {
  private currentComponent: GenericNodeDetailsComponent | null = null;

  constructor(
    private container: HTMLElement,
    private nodeService: NodeService,
    private hljs: any
  ) {
    // Controller is initialized and ready to receive node data
    // via the displayNodeDetails method (called by VisualizationController)
    this.clearDetails();
  }

  /**
   * Display details for a selected node
   * Called by VisualizationController when a node is selected
   * @param nodeData - Node data object from D3 hierarchy (contains data.id)
   */
  displayNodeDetails(nodeData: any): void {
    if (!nodeData || !nodeData.data) {
      this.clearDetails();
      return;
    }

    // Extract node ID from the data
    const nodeId = nodeData.data.id || nodeData.id;
    if (!nodeId) {
      this.clearDetails();
      return;
    }

    // Get typed entity from NodeService
    const node = this.nodeService.getNode(nodeId);
    if (!node) {
      this.clearDetails();
      return;
    }

    // Use factory to create and render the appropriate component
    this.currentComponent = NodeDetailsComponentFactory.renderNode(
      this.container,
      node,
      this.hljs
    );
  }

  /**
   * Clear the node details display
   */
  clearDetails(): void {
    if (this.currentComponent) {
      this.currentComponent.clear();
    } else {
      // If no component exists yet, clear manually
      this.container.innerHTML = '<div class="detail-empty">Select a node to view details</div>';
    }
  }

  /**
   * Get a callback function for node selection
   * Returns a function that can be passed to VisualizationController
   */
  getNodeSelectCallback(): (nodeData: any) => void {
    return (nodeData: any) => this.displayNodeDetails(nodeData);
  }
}
