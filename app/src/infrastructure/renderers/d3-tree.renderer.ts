/**
 * D3 Tree Renderer
 * Orchestrates tree visualization using specialized components
 * Implements ITreeRenderer interface
 */

import { ITreeRenderer, TreeRenderConfig } from '../../application/interfaces/i-tree-renderer';
import { EnrichedNode, CTEMetadata } from '../../../../types/plan-data';
import { NodeService } from '../../domain/services/node.service';

// Components
import { SVGCanvasManager } from './tree-renderer-components/svg-canvas-manager';
import { TreeLayoutEngine } from './tree-renderer-components/tree-layout-engine';
import { LinkRenderer } from './tree-renderer-components/link-renderer';
import { NodeRenderer } from './tree-renderer-components/node-renderer';
import { CTEGroupManager } from './tree-renderer-components/cte-group-manager';
import { InteractionController } from './tree-renderer-components/interaction-controller';
import { ForestLayoutEngine } from './tree-renderer-components/forest-layout-engine';
import { ForestLayoutManager } from './tree-renderer-components/forest-layout-manager';
import { CTETreeExtractor, ForestLayout } from './cte-tree-extractor';

export class D3TreeRenderer implements ITreeRenderer {
  // Components
  private canvasManager: SVGCanvasManager;
  private layoutEngine: TreeLayoutEngine;
  private linkRenderer: LinkRenderer;
  private nodeRenderer: NodeRenderer;
  private cteManager: CTEGroupManager;
  private interactionController: InteractionController;
  private forestLayoutEngine: ForestLayoutEngine;
  private forestLayoutManager: ForestLayoutManager;
  private cteTreeExtractor: CTETreeExtractor;

  private currentConfig: TreeRenderConfig | null = null;
  private d3: any;

  // Forest layout state for CTE highlighting
  private currentForestLayout: ForestLayout | null = null;
  private currentCTEMetadata: CTEMetadata | null = null;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;

    // Initialize all components
    this.canvasManager = new SVGCanvasManager(d3Instance);
    this.layoutEngine = new TreeLayoutEngine(d3Instance);
    this.linkRenderer = new LinkRenderer(d3Instance);
    this.nodeRenderer = new NodeRenderer(d3Instance);
    this.cteManager = new CTEGroupManager(d3Instance);
    this.interactionController = new InteractionController(d3Instance);
    this.forestLayoutEngine = new ForestLayoutEngine(d3Instance);
    this.forestLayoutManager = new ForestLayoutManager(
      d3Instance,
      this.linkRenderer,
      this.nodeRenderer,
      this.interactionController
    );
    this.cteTreeExtractor = new CTETreeExtractor();
  }

  /**
   * Set the NodeService for accessing typed entities
   */
  setNodeService(nodeService: NodeService): void {
    this.nodeRenderer.setNodeService(nodeService);
  }

  /**
   * Render the tree visualization
   */
  render(config: TreeRenderConfig): void {
    this.currentConfig = config;

    // Check if we have CTE metadata and should render forest layout
    if (config.cteMetadata && config.cteMetadata.cteDefinitions.size > 0) {
      this.renderForest(config);
    } else {
      this.renderSingleTree(config);
    }
  }

  /**
   * Render single tree (original behavior, no CTEs)
   */
  private renderSingleTree(config: TreeRenderConfig): void {
    // 1. Clear previous visualization
    this.clear();

    // 2. Create SVG canvas
    const canvas = this.canvasManager.createCanvas({
      container: config.container
    });

    // 3. Calculate tree layout
    const layout = this.layoutEngine.calculateLayout(config.treeData);

    // 4. Separate overlapping CTE groups (adjusts node positions)
    this.cteManager.separateGroups(layout);

    // 5. Render visualization layers (order matters for z-index)
    this.linkRenderer.renderLinks(canvas.svg, layout);
    this.cteManager.renderGroups(canvas.svg, layout);
    this.nodeRenderer.renderNodes(canvas.svg, layout, config.onNodeClick);

    // 6. Setup interactive controls
    this.interactionController.setupZoom(canvas);
  }

  /**
   * Render forest layout (main tree + disconnected CTE trees)
   */
  /**
   * Render forest layout (main tree + CTE trees)
   * Delegates to ForestLayoutManager for complex forest rendering logic
   */
  private renderForest(config: TreeRenderConfig): void {
    if (!config.cteMetadata) return;

    // 1. Clear previous visualization
    this.clear();

    // 2. Extract CTE trees from main tree
    const forestLayout = this.cteTreeExtractor.extract(config.treeData, config.cteMetadata);

    // Store for CTE highlighting
    this.currentForestLayout = forestLayout;
    this.currentCTEMetadata = config.cteMetadata;

    // 3. Calculate layouts for all trees
    const mainLayout = this.layoutEngine.calculateLayout(forestLayout.mainTree);
    const cteLayouts = forestLayout.cteTrees.map(({ cteName, tree }) => ({
      cteName,
      layout: this.layoutEngine.calculateLayout(tree)
    }));

    // 4. Calculate forest positioning
    const forestPositioning = this.forestLayoutEngine.calculateForestLayout(mainLayout, cteLayouts);

    // 5. Create canvas
    const margin = { top: 60, right: 40, bottom: 80, left: 40 };
    const canvas = this.canvasManager.createCanvas({
      container: config.container,
      margin: margin,
      minWidth: 2000, // Temporary - ForestLayoutManager will handle proper sizing
      minHeight: 2000
    });

    // 6. Delegate rendering to ForestLayoutManager
    this.forestLayoutManager.renderForest({
      container: config.container,
      canvas,
      mainLayout,
      mainTreeX: 300,
      mainTreeY: 100,
      forestPositioning,
      forestLayout,
      onNodeClick: config.onNodeClick
    });
  }

  /**
   * Highlight a specific node by ID with bidirectional CTE highlighting
   */
  highlightNode(nodeId: string): void {
    // Default highlighting
    this.interactionController.highlightNode(nodeId);

    // If we have CTE metadata, add bidirectional highlighting
    if (!this.currentCTEMetadata || !this.currentForestLayout) return;

    // Find the clicked node
    const clickedNode = this.findNodeInForest(nodeId);
    if (!clickedNode) return;

    // Case 1: CTE Scan node clicked - highlight target CTE tree
    if (clickedNode.name === 'CTE Scan' && clickedNode.details?.cteName) {
      const cteName = clickedNode.details.cteName;
      this.highlightCTETree(cteName);
    }

    // Case 2: Node in CTE tree clicked - highlight all scan nodes that reference this CTE
    const cteNameOfClickedNode = this.getCTENameForNode(clickedNode);
    if (cteNameOfClickedNode) {
      this.highlightCTEScanNodes(cteNameOfClickedNode);
    }
  }

  /**
   * Find a node by ID in the forest layout
   */
  private findNodeInForest(nodeId: string): EnrichedNode | null {
    if (!this.currentForestLayout) return null;

    // Search in main tree
    let found = this.findNodeInTree(this.currentForestLayout.mainTree, nodeId);
    if (found) return found;

    // Search in CTE trees
    for (const cteTree of this.currentForestLayout.cteTrees) {
      found = this.findNodeInTree(cteTree.tree, nodeId);
      if (found) return found;
    }

    return null;
  }

  /**
   * Find a node by ID in a tree
   */
  private findNodeInTree(node: EnrichedNode, targetId: string): EnrichedNode | null {
    if (node.id === targetId) return node;

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeInTree(child, targetId);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Get CTE name for a node (if it's part of a CTE tree)
   */
  private getCTENameForNode(node: EnrichedNode): string | null {
    if (!this.currentCTEMetadata) return null;

    // Check if this node is part of any CTE definition tree
    for (const [cteName, cteInfo] of this.currentCTEMetadata.cteDefinitions) {
      if (this.isNodeInSubtree(cteInfo.rootNode, node.id || '')) {
        return cteName;
      }
    }

    return null;
  }

  /**
   * Check if a node ID is in a subtree
   */
  private isNodeInSubtree(root: EnrichedNode, targetId: string): boolean {
    if (root.id === targetId) return true;

    if (root.children) {
      for (const child of root.children) {
        if (this.isNodeInSubtree(child, targetId)) return true;
      }
    }

    return false;
  }

  /**
   * Highlight all nodes in a CTE tree
   */
  private highlightCTETree(cteName: string): void {
    if (!this.currentCTEMetadata) return;

    const cteInfo = this.currentCTEMetadata.cteDefinitions.get(cteName);
    if (!cteInfo) return;

    // Collect all node IDs in the CTE tree
    const nodeIds: string[] = [];
    this.collectNodeIds(cteInfo.rootNode, nodeIds);

    // Highlight all nodes in the CTE tree
    nodeIds.forEach(id => {
      const svg = this.d3.select(this.currentConfig?.container).select('svg g');
      svg.selectAll('.node')
        .filter((d: any) => d.data.id === id)
        .classed('cte-referenced', true);
    });
  }

  /**
   * Highlight all CTE Scan nodes that reference a CTE
   */
  private highlightCTEScanNodes(cteName: string): void {
    if (!this.currentCTEMetadata) return;

    // Find all references to this CTE
    const references = this.currentCTEMetadata.cteReferences.filter(
      ref => ref.cteName === cteName
    );

    // Highlight all scan nodes
    references.forEach(ref => {
      const svg = this.d3.select(this.currentConfig?.container).select('svg g');
      svg.selectAll('.node')
        .filter((d: any) => d.data.id === ref.nodeId)
        .classed('cte-referenced', true);
    });
  }

  /**
   * Collect all node IDs in a subtree
   */
  private collectNodeIds(node: EnrichedNode, ids: string[]): void {
    if (node.id) ids.push(node.id);

    if (node.children) {
      node.children.forEach(child => this.collectNodeIds(child, ids));
    }
  }

  /**
   * Highlight a path of nodes (e.g., critical path)
   */
  highlightPath(nodeIds: string[]): void {
    this.interactionController.highlightPath(nodeIds);
  }

  /**
   * Initialize critical path visualizer
   */
  initializeCriticalPath(criticalPath: EnrichedNode[]): void {
    this.interactionController.initializeCriticalPath(criticalPath);
  }

  /**
   * Toggle critical path visualization
   */
  toggleCriticalPath(criticalPath: EnrichedNode[], enabled: boolean): void {
    this.interactionController.toggleCriticalPath(criticalPath, enabled);
  }


  /**
   * Clean up and destroy the renderer
   */
  destroy(): void {
    this.clear();
    this.interactionController.destroy();
    this.currentConfig = null;
  }

  /**
   * Clear existing visualization
   */
  private clear(): void {
    if (this.currentConfig?.container) {
      this.canvasManager.clear(this.currentConfig.container);
    }
  }
}
