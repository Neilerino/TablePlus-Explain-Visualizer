/**
 * Node Details Controller
 * Handles node selection events and coordinates detail display
 */

import { NodeDetailsComponent } from '../components/node-details.component';

export class NodeDetailsController {
  constructor(
    private component: NodeDetailsComponent,
    private hljs: any
  ) {
    // Controller is initialized and ready to receive node data
    // via the displayNodeDetails method (called by VisualizationController)
  }

  /**
   * Display details for a selected node
   * Called by VisualizationController when a node is selected
   * @param nodeData - Node data object from D3 hierarchy
   */
  displayNodeDetails(nodeData: any): void {
    this.component.setNodeData(nodeData, this.hljs);
  }

  /**
   * Clear the node details display
   */
  clearDetails(): void {
    this.component.clear();
  }

  /**
   * Get a callback function for node selection
   * Returns a function that can be passed to VisualizationController
   */
  getNodeSelectCallback(): (nodeData: any) => void {
    return (nodeData: any) => this.displayNodeDetails(nodeData);
  }
}
