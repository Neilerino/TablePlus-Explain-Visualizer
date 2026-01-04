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
  private renderForest(config: TreeRenderConfig): void {
    if (!config.cteMetadata) return;

    // 1. Clear previous visualization
    this.clear();

    // 2. Extract CTE trees from main tree
    const forestLayout = this.cteTreeExtractor.extract(config.treeData, config.cteMetadata);

    console.log('🌲 Forest Layout Extracted:', {
      mainTreeHasChildren: !!forestLayout.mainTree.children,
      mainTreeChildCount: forestLayout.mainTree.children?.length || 0,
      cteTreeCount: forestLayout.cteTrees.length,
      cteTreeNames: forestLayout.cteTrees.map(t => t.cteName),
      cteTreeDetails: forestLayout.cteTrees.map(t => ({
        name: t.cteName,
        hasChildren: !!t.tree.children,
        childCount: t.tree.children?.length || 0,
        nodeType: t.tree.name
      }))
    });

    // Store for CTE highlighting
    this.currentForestLayout = forestLayout;
    this.currentCTEMetadata = config.cteMetadata;

    // 3. Calculate layouts for all trees FIRST (before creating canvas)
    const mainLayout = this.layoutEngine.calculateLayout(forestLayout.mainTree);
    const cteLayouts = forestLayout.cteTrees.map(({ cteName, tree }) => ({
      cteName,
      layout: this.layoutEngine.calculateLayout(tree)
    }));

    console.log('📐 Layouts Calculated:', {
      mainTreeNodeCount: mainLayout.descendants().length,
      cteLayouts: cteLayouts.map(l => ({
        name: l.cteName,
        nodeCount: l.layout.descendants().length
      }))
    });

    // 4. Calculate forest positioning
    const forestPositioning = this.forestLayoutEngine.calculateForestLayout(mainLayout, cteLayouts);

    console.log('📍 Forest Positioning:', {
      mainTree: forestPositioning.mainTree.bounds,
      cteTrees: forestPositioning.cteTrees.map(t => ({
        name: t.cteName,
        offset: { x: t.offsetX, y: t.offsetY },
        bounds: t.bounds
      })),
      totalBounds: forestPositioning.totalBounds
    });

    // 5. Setup layout constants
    const mainTreeX = 300; // Increased from 100 to ensure space for left-extending nodes
    const mainTreeY = 100;
    const mainTreeHeight = forestPositioning.mainTree.bounds.height;
    const mainTreeWidth = forestPositioning.mainTree.bounds.width;

    const cteStartX = 300; // Increased from 100 to ensure space for left-extending nodes
    const cteStartY = mainTreeY + mainTreeHeight + 200;
    const cteSpacing = 200;

    // 6. Analyze CTE dependencies and arrange in layers
    const cteLayers = this.analyzeCTEDependencies(forestPositioning.cteTrees, forestLayout.cteReferences);
    console.log('📊 CTE Layers:', cteLayers);

    // 7. Collect CTE tree positions first (for reference links and borders)
    console.log('📍 Calculating CTE positions...');
    const cteTreePositions: Array<{ cteName: string, x: number, y: number, bounds: any, layer: number }> = [];

    let currentLayerY = cteStartY;
    cteLayers.forEach((layerCTEs, layerIndex) => {
      let currentX = cteStartX;
      let maxHeightInLayer = 0;

      layerCTEs.forEach(cteName => {
        const positionedTree = forestPositioning.cteTrees.find(t => t.cteName === cteName);
        if (!positionedTree) return;

        // Calculate actual bounds from layout nodes
        const nodes = positionedTree.layout.descendants();
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const nodeWidth = 180;
        const nodeHeight = 90;

        nodes.forEach((node: any) => {
          minX = Math.min(minX, node.x - nodeWidth / 2);
          maxX = Math.max(maxX, node.x + nodeWidth / 2);
          minY = Math.min(minY, node.y);
          maxY = Math.max(maxY, node.y + nodeHeight);
        });

        const actualBounds = {
          width: maxX - minX,
          height: maxY - minY,
          minX,
          maxX,
          minY,
          maxY
        };

        cteTreePositions.push({
          cteName,
          x: currentX,
          y: currentLayerY,
          bounds: actualBounds,
          layer: layerIndex
        });

        currentX += actualBounds.width + cteSpacing;
        maxHeightInLayer = Math.max(maxHeightInLayer, actualBounds.height);
      });

      currentLayerY += maxHeightInLayer + 250; // Vertical gap between layers
    });

    // 8. Calculate canvas size based on actual CTE positions
    const maxCTEX = Math.max(...cteTreePositions.map(p => p.x + p.bounds.width), mainTreeWidth + 200);
    const maxCTEY = Math.max(...cteTreePositions.map(p => p.y + p.bounds.height), cteStartY);
    const totalWidth = maxCTEX + 100;
    const totalHeight = maxCTEY + 100;

    console.log('📏 Canvas Layout:', {
      mainTree: { x: mainTreeX, y: mainTreeY, width: mainTreeWidth, height: mainTreeHeight },
      cteStart: { x: cteStartX, y: cteStartY },
      totalDimensions: { width: totalWidth, height: totalHeight },
      layers: cteLayers.length
    });

    const margin = { top: 60, right: 40, bottom: 80, left: 40 };
    const canvas = this.canvasManager.createCanvas({
      container: config.container,
      margin: margin,
      minWidth: totalWidth + margin.left + margin.right,
      minHeight: totalHeight + margin.top + margin.bottom
    });

    // 9. Render MAIN TREE
    console.log('🌲 Rendering main tree...');
    const mainTreeGroup = canvas.svg.append('g')
      .attr('class', 'main-tree-group')
      .attr('transform', `translate(${mainTreeX}, ${mainTreeY})`);

    this.linkRenderer.renderLinks(mainTreeGroup, mainLayout);
    this.nodeRenderer.renderNodes(mainTreeGroup, mainLayout, config.onNodeClick);

    // 10. Render CTE border boxes (background layer)
    console.log('📦 Rendering CTE borders...');
    cteTreePositions.forEach((pos, index) => {
      const padding = 20;
      const labelHeight = 30;

      const boxX = pos.x + pos.bounds.minX - padding;
      const boxY = pos.y + pos.bounds.minY - labelHeight - padding;
      const boxWidth = pos.bounds.width + padding * 2;
      const boxHeight = pos.bounds.height + labelHeight + padding * 2;

      // Border box
      canvas.svg.append('rect')
        .attr('class', 'cte-group-border')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(100, 150, 200, 0.6)')
        .attr('stroke-width', '2')
        .attr('stroke-dasharray', '5,5')
        .attr('rx', '8');

      // Label background
      canvas.svg.append('rect')
        .attr('class', 'cte-label-bg')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', boxWidth)
        .attr('height', labelHeight)
        .attr('fill', 'rgba(100, 150, 200, 0.15)')
        .attr('rx', '8');

      // Label text
      canvas.svg.append('text')
        .attr('class', 'cte-label')
        .attr('x', boxX + padding)
        .attr('y', boxY + labelHeight - 10)
        .attr('fill', 'rgba(100, 150, 200, 1)')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text(`CTE: ${pos.cteName} (Layer ${pos.layer})`);
    });

    // 11. Render reference links (behind nodes)
    console.log('🔗 Rendering CTE reference links...');
    this.renderCTEReferenceLinks(
      canvas.svg,
      mainLayout,
      mainTreeX,
      mainTreeY,
      cteTreePositions,
      forestPositioning.cteTrees,
      forestLayout.cteReferences
    );

    // 12. Render CTE trees (on top)
    console.log('🌳 Rendering CTE trees...');
    cteTreePositions.forEach((pos, index) => {
      const positionedTree = forestPositioning.cteTrees.find(t => t.cteName === pos.cteName);
      if (!positionedTree) return;

      // Create a group for this CTE tree
      const treeGroup = canvas.svg.append('g')
        .attr('class', `cte-tree-group cte-${index}`)
        .attr('transform', `translate(${pos.x}, ${pos.y})`);

      // Render tree content
      this.linkRenderer.renderLinks(treeGroup, positionedTree.layout);
      this.nodeRenderer.renderNodes(treeGroup, positionedTree.layout, config.onNodeClick);
    });

    // 13. Setup interactive controls and center on main tree root
    this.interactionController.setupZoom(canvas);

    // Get the root node position (should be at mainTreeX, mainTreeY)
    const rootNode = mainLayout; // Root is the layout itself
    const rootX = mainTreeX + (rootNode.layout.x || 0);
    const rootY = mainTreeY + (rootNode.layout.y || 0);

    console.log('🎯 Initial View Centering:', {
      mainTreeX,
      mainTreeY,
      rootNodeX: rootNode.layout.x || 0,
      rootNodeY: rootNode.layout.y || 0,
      finalRootX: rootX,
      finalRootY: rootY,
      scale: 1.0
    });

    // Center view on root node at 100% zoom (readable text)
    this.interactionController.centerOnPoint(
      config.container,
      rootX,
      rootY,
      1.0 // 100% zoom - readable and focused on root
    );
  }

  /**
   * Render a tree at a specific offset position
   */
  private renderTreeAtOffset(
    svg: any,
    layout: any,
    offsetX: number,
    offsetY: number,
    onNodeClick: (nodeId: string) => void,
    debugLabel?: string
  ): void {
    // Apply offset to all nodes FIRST (before rendering)
    const nodes = layout.descendants();

    if (debugLabel) {
      console.log(`  📍 ${debugLabel} - Before offset:`, {
        nodeCount: nodes.length,
        firstNode: nodes[0] ? { x: nodes[0].x, y: nodes[0].y, id: nodes[0].data?.id } : null
      });
    }

    nodes.forEach((node: any) => {
      node.x += offsetX;
      node.y += offsetY;
    });

    if (debugLabel) {
      console.log(`  📍 ${debugLabel} - After offset:`, {
        offset: { x: offsetX, y: offsetY },
        firstNode: nodes[0] ? { x: nodes[0].x, y: nodes[0].y, id: nodes[0].data?.id } : null,
        lastNode: nodes[nodes.length - 1] ? { x: nodes[nodes.length - 1].x, y: nodes[nodes.length - 1].y } : null
      });
    }

    // Now render links and nodes with correct positions
    this.linkRenderer.renderLinks(svg, layout);
    this.nodeRenderer.renderNodes(svg, layout, onNodeClick);

    if (debugLabel) {
      console.log(`  ✅ ${debugLabel} - Rendered ${nodes.length} nodes`);
    }
  }

  /**
   * Render dashed reference links from CTE Scan nodes to CTE definitions
   */
  private renderCTEReferenceLinks(
    svg: any,
    mainLayout: any,
    mainTreeX: number,
    mainTreeY: number,
    cteTreePositions: Array<{ cteName: string, x: number, y: number, bounds: any }>,
    positionedCTETrees: any[],
    cteReferences: any[]
  ): void {
    // Build node position map from all trees
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Collect positions from main tree
    mainLayout.descendants().forEach((node: any) => {
      if (node.data.id) {
        nodePositions.set(node.data.id, {
          x: node.x + mainTreeX,
          y: node.y + mainTreeY
        });
      }
    });

    // Collect positions from CTE trees
    positionedCTETrees.forEach((positionedTree: any) => {
      // Match by CTE name, not by index (arrays may be in different orders due to layering)
      const ctePos = cteTreePositions.find(p => p.cteName === positionedTree.cteName);
      if (!ctePos) {
        console.warn(`⚠️ Could not find position for CTE: ${positionedTree.cteName}`);
        return;
      }

      positionedTree.layout.descendants().forEach((node: any) => {
        if (node.data.id) {
          nodePositions.set(node.data.id, {
            x: node.x + ctePos.x,
            y: node.y + ctePos.y
          });
        }
      });
    });

    // Debug logging
    console.log('🔗 Reference Link Debug:', {
      totalReferences: cteReferences.length,
      totalNodePositions: nodePositions.size,
      mainTreeNodes: mainLayout.descendants().length,
      cteTreeNodes: positionedCTETrees.reduce((sum, t) => sum + t.layout.descendants().length, 0)
    });

    // Draw reference links with interactive hover effects
    let successCount = 0;
    let failCount = 0;

    cteReferences.forEach((ref, idx) => {
      const sourcePos = nodePositions.get(ref.nodeId);
      const targetPos = ref.targetCTENodeId ? nodePositions.get(ref.targetCTENodeId) : null;

      if (!sourcePos) {
        console.warn(`❌ Reference ${idx}: Source node ${ref.nodeId} not found`);
        failCount++;
        return;
      }

      if (!targetPos) {
        console.warn(`❌ Reference ${idx}: Target node ${ref.targetCTENodeId} (CTE: ${ref.cteName}) not found`);
        failCount++;
        return;
      }

      if (sourcePos && targetPos) {
        successCount++;

        console.log(`🔗 Drawing link #${idx}:`, {
          cteName: ref.cteName,
          sourceNodeId: ref.nodeId,
          targetNodeId: ref.targetCTENodeId,
          sourcePos: { x: Math.round(sourcePos.x), y: Math.round(sourcePos.y) },
          targetPos: { x: Math.round(targetPos.x), y: Math.round(targetPos.y) }
        });

        const linkGenerator = this.d3.linkVertical()
          .x((d: any) => d.x)
          .y((d: any) => d.y);

        const link = svg.append('path')
          .attr('class', 'cte-reference-link')
          .attr('d', linkGenerator({
            source: { x: sourcePos.x, y: sourcePos.y + 45 },  // From bottom of scan node
            target: { x: targetPos.x, y: targetPos.y }         // To top of CTE node
          }))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(100, 150, 200, 0.6)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('cursor', 'pointer')
          .on('mouseenter', () => {
            // Brighten link
            link.attr('stroke', 'rgba(100, 150, 200, 1)')
              .attr('stroke-width', 3);

            // Highlight source and target nodes
            svg.selectAll('.node')
              .filter((d: any) => d.data.id === ref.nodeId || d.data.id === ref.targetCTENodeId)
              .classed('cte-link-hover', true);
          })
          .on('mouseleave', () => {
            // Restore link
            link.attr('stroke', 'rgba(100, 150, 200, 0.6)')
              .attr('stroke-width', 2);

            // Remove highlight from nodes
            svg.selectAll('.node')
              .classed('cte-link-hover', false);
          });
      }
    });

    console.log(`✅ Reference Links: ${successCount} drawn, ${failCount} failed`);
  }

  /**
   * Render labels above each CTE tree with usage count badges
   */
  private renderCTELabels(svg: any, forestPositioning: any, normalizeX: number, normalizeY: number): void {
    if (!this.currentForestLayout) return;

    forestPositioning.cteTrees.forEach((positionedTree: any) => {
      const bounds = positionedTree.bounds;
      const x = bounds.minX + positionedTree.offsetX + normalizeX;
      const y = bounds.minY + positionedTree.offsetY + normalizeY - 30;  // Above tree

      // Count references to this CTE
      const usageCount = this.currentForestLayout!.cteReferences.filter(
        ref => ref.cteName === positionedTree.cteName
      ).length;

      // Background rectangle
      const label = svg.append('g').attr('class', 'cte-label');

      label.append('rect')
        .attr('x', x)
        .attr('y', y - 15)
        .attr('width', 120)
        .attr('height', 25)
        .attr('rx', 4)
        .attr('fill', 'rgba(100, 150, 200, 0.2)')
        .attr('stroke', 'rgba(100, 150, 200, 0.5)')
        .attr('stroke-width', 1);

      // CTE name text
      label.append('text')
        .attr('x', x + 10)
        .attr('y', y)
        .attr('fill', 'rgba(100, 150, 200, 1)')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(`CTE: ${positionedTree.cteName}`);

      // Usage count badge (circular badge at top-right)
      if (usageCount > 0) {
        const badgeX = x + 115;
        const badgeY = y - 12;
        const badgeRadius = 10;

        // Badge circle
        label.append('circle')
          .attr('cx', badgeX)
          .attr('cy', badgeY)
          .attr('r', badgeRadius)
          .attr('fill', 'rgba(100, 150, 200, 0.9)')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);

        // Badge text
        label.append('text')
          .attr('x', badgeX)
          .attr('y', badgeY + 1)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text(usageCount);
      }
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
   * Analyze CTE dependencies and arrange into layers using topological sort
   * CTEs with no dependencies go in layer 0, CTEs that depend on layer 0 go in layer 1, etc.
   */
  private analyzeCTEDependencies(cteTrees: any[], cteReferences: any[]): string[][] {
    // Build dependency graph: Map<cteName, Set<dependsOnCTEName>>
    const dependencies = new Map<string, Set<string>>();
    const allCTEs = new Set<string>();

    // Initialize with all CTE names
    cteTrees.forEach(tree => {
      allCTEs.add(tree.cteName);
      dependencies.set(tree.cteName, new Set());
    });

    // Find CTE-to-CTE dependencies
    // A CTE depends on another if it has a CTE Scan node that references that other CTE
    cteReferences.forEach(ref => {
      // Find which CTE contains this reference node
      const containingCTE = cteTrees.find(tree => {
        return tree.layout.descendants().some((node: any) => node.data?.id === ref.nodeId);
      });

      if (containingCTE && ref.cteName && ref.cteName !== containingCTE.cteName) {
        // containingCTE depends on ref.cteName
        dependencies.get(containingCTE.cteName)?.add(ref.cteName);
      }
    });

    // Topological sort using Kahn's algorithm
    const layers: string[][] = [];
    const inDegree = new Map<string, number>();
    const remaining = new Set(allCTEs);

    // Calculate in-degrees
    allCTEs.forEach(cte => {
      inDegree.set(cte, 0);
    });

    dependencies.forEach((deps, cte) => {
      deps.forEach(dep => {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      });
    });

    // Process layers
    while (remaining.size > 0) {
      // Find CTEs with no dependencies (in-degree = 0)
      const currentLayer: string[] = [];
      remaining.forEach(cte => {
        if (inDegree.get(cte) === 0) {
          currentLayer.push(cte);
        }
      });

      if (currentLayer.length === 0) {
        // Circular dependency or isolated nodes - add remaining to last layer
        remaining.forEach(cte => currentLayer.push(cte));
      }

      layers.push(currentLayer);

      // Remove current layer and update in-degrees
      currentLayer.forEach(cte => {
        remaining.delete(cte);
        const dependents = dependencies.get(cte);
        if (dependents) {
          dependents.forEach(dep => {
            inDegree.set(dep, (inDegree.get(dep) || 0) - 1);
          });
        }
      });
    }

    return layers;
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
