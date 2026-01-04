/**
 * Forest Layout Manager
 * Orchestrates the rendering of CTE forest layouts (main tree + multiple CTE trees)
 */

import { LinkRenderer } from './link-renderer';
import { NodeRenderer } from './node-renderer';
import { InteractionController } from './interaction-controller';
import { CTEDependencyAnalyzer } from './cte-components/cte-dependency-analyzer';
import { CTEBorderRenderer } from './cte-components/cte-border-renderer';
import { CTEReferenceLinksRenderer } from './cte-components/cte-reference-links-renderer';
import type { CTEPosition } from './cte-components/cte-border-renderer';

export interface ForestRenderConfig {
  container: HTMLElement;
  canvas: any;
  mainLayout: any;
  mainTreeX: number;
  mainTreeY: number;
  forestPositioning: any;
  forestLayout: any;
  onNodeClick: (nodeId: string) => void;
}

export class ForestLayoutManager {
  private d3: any;
  private linkRenderer: LinkRenderer;
  private nodeRenderer: NodeRenderer;
  private interactionController: InteractionController;
  private dependencyAnalyzer: CTEDependencyAnalyzer;

  constructor(
    d3Instance: any,
    linkRenderer: LinkRenderer,
    nodeRenderer: NodeRenderer,
    interactionController: InteractionController
  ) {
    this.d3 = d3Instance;
    this.linkRenderer = linkRenderer;
    this.nodeRenderer = nodeRenderer;
    this.interactionController = interactionController;
    this.dependencyAnalyzer = new CTEDependencyAnalyzer();
  }

  /**
   * Render the complete forest layout (main tree + CTE trees in layers)
   */
  renderForest(config: ForestRenderConfig): void {
    const {
      container,
      canvas,
      mainLayout,
      mainTreeX,
      mainTreeY,
      forestPositioning,
      forestLayout,
      onNodeClick
    } = config;

    const mainTreeHeight = forestPositioning.mainTree.bounds.height;
    const cteStartX = 300;
    const cteStartY = mainTreeY + mainTreeHeight + 200;
    const cteSpacing = 200;

    const cteLayers = this.dependencyAnalyzer.analyzeDependencies(
      forestPositioning.cteTrees,
      forestLayout.cteReferences
    );

    const cteTreePositions = this.calculateCTEPositions(
      cteLayers,
      forestPositioning.cteTrees,
      cteStartX,
      cteStartY,
      cteSpacing
    );

    this.renderMainTree(canvas.svg, mainLayout, mainTreeX, mainTreeY, onNodeClick);

    const borderRenderer = new CTEBorderRenderer(canvas.svg);
    borderRenderer.renderBorders(cteTreePositions);

    const referenceLinksRenderer = new CTEReferenceLinksRenderer(this.d3, canvas.svg);
    referenceLinksRenderer.renderLinks(
      mainLayout,
      mainTreeX,
      mainTreeY,
      cteTreePositions,
      forestPositioning.cteTrees,
      forestLayout.cteReferences
    );

    this.renderCTETrees(canvas.svg, cteTreePositions, forestPositioning.cteTrees, onNodeClick);

    this.setupInitialView(container, canvas, mainLayout, mainTreeX, mainTreeY);
  }

  /**
   * Calculate positions for all CTE trees based on layer arrangement
   */
  private calculateCTEPositions(
    cteLayers: string[][],
    cteTrees: any[],
    startX: number,
    startY: number,
    spacing: number
  ): CTEPosition[] {
    const positions: CTEPosition[] = [];
    let currentLayerY = startY;

    cteLayers.forEach((layerCTEs, layerIndex) => {
      let currentX = startX;
      let maxHeightInLayer = 0;

      layerCTEs.forEach(cteName => {
        const positionedTree = cteTrees.find(t => t.cteName === cteName);
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

        positions.push({
          cteName,
          x: currentX,
          y: currentLayerY,
          bounds: actualBounds,
          layer: layerIndex
        });

        currentX += actualBounds.width + spacing;
        maxHeightInLayer = Math.max(maxHeightInLayer, actualBounds.height);
      });

      currentLayerY += maxHeightInLayer + 250; // Vertical gap between layers
    });

    return positions;
  }

  /**
   * Calculate total canvas width
   */
  private calculateTotalWidth(ctePositions: CTEPosition[], mainTreeWidth: number): number {
    const maxCTEX = Math.max(
      ...ctePositions.map(p => p.x + p.bounds.width),
      mainTreeWidth + 200
    );
    return maxCTEX + 100;
  }

  /**
   * Calculate total canvas height
   */
  private calculateTotalHeight(ctePositions: CTEPosition[], cteStartY: number): number {
    const maxCTEY = Math.max(
      ...ctePositions.map(p => p.y + p.bounds.height),
      cteStartY
    );
    return maxCTEY + 100;
  }

  /**
   * Render the main tree
   */
  private renderMainTree(
    svg: any,
    mainLayout: any,
    mainTreeX: number,
    mainTreeY: number,
    onNodeClick: (nodeId: string) => void
  ): void {
    const mainTreeGroup = svg.append('g')
      .attr('class', 'main-tree-group')
      .attr('transform', `translate(${mainTreeX}, ${mainTreeY})`);

    this.linkRenderer.renderLinks(mainTreeGroup, mainLayout);
    this.nodeRenderer.renderNodes(mainTreeGroup, mainLayout, onNodeClick);
  }

  /**
   * Render all CTE trees
   */
  private renderCTETrees(
    svg: any,
    ctePositions: CTEPosition[],
    positionedCTETrees: any[],
    onNodeClick: (nodeId: string) => void
  ): void {
    ctePositions.forEach((pos, index) => {
      const positionedTree = positionedCTETrees.find(t => t.cteName === pos.cteName);
      if (!positionedTree) return;

      // Create a group for this CTE tree
      const treeGroup = svg.append('g')
        .attr('class', `cte-tree-group cte-${index}`)
        .attr('transform', `translate(${pos.x}, ${pos.y})`);

      // Render tree content
      this.linkRenderer.renderLinks(treeGroup, positionedTree.layout);
      this.nodeRenderer.renderNodes(treeGroup, positionedTree.layout, onNodeClick);
    });
  }

  /**
   * Setup initial view centered on main tree root
   */
  private setupInitialView(
    container: HTMLElement,
    canvas: any,
    mainLayout: any,
    mainTreeX: number,
    mainTreeY: number
  ): void {
    this.interactionController.setupZoom(canvas);

    const rootNode = mainLayout;
    const rootX = mainTreeX + (rootNode.layout?.x || 0);
    const rootY = mainTreeY + (rootNode.layout?.y || 0);

    this.interactionController.centerOnPoint(
      container,
      rootX,
      rootY,
      1.0
    );
  }
}
