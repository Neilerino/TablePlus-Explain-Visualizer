/**
 * SVG Canvas Manager
 * Handles SVG container creation, dimensions, and cleanup
 */

export interface CanvasConfig {
  container: HTMLElement;
  margin?: { top: number; right: number; bottom: number; left: number };
  minWidth?: number;
  minHeight?: number;
}

export interface Canvas {
  svgContainer: any;
  svg: any;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export class SVGCanvasManager {
  private d3: any;
  private readonly DEFAULT_MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };
  private readonly DEFAULT_MIN_WIDTH = 1200;
  private readonly DEFAULT_MIN_HEIGHT = 800;

  private currentCanvas: Canvas | null = null;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Create SVG canvas with viewBox for responsive scaling
   */
  createCanvas(config: CanvasConfig): Canvas {
    const margin = config.margin || this.DEFAULT_MARGIN;
    const minWidth = config.minWidth || this.DEFAULT_MIN_WIDTH;
    const minHeight = config.minHeight || this.DEFAULT_MIN_HEIGHT;

    const containerWidth = config.container.clientWidth;
    const containerHeight = config.container.clientHeight;
    const width = Math.max(containerWidth, minWidth) - margin.left - margin.right;
    const height = Math.max(containerHeight, minHeight) - margin.top - margin.bottom;

    // Create SVG with viewBox for better scaling
    const svgContainer = this.d3.select(config.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    // Create main group for zoom/pan
    const svg = svgContainer.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.currentCanvas = { svgContainer, svg, width, height, margin };
    return this.currentCanvas;
  }

  /**
   * Clear all SVG content
   */
  clear(container: HTMLElement): void {
    this.d3.select(container).selectAll('*').remove();
    this.currentCanvas = null;
  }

  /**
   * Get current canvas dimensions
   */
  getDimensions(): { width: number; height: number } | null {
    if (!this.currentCanvas) return null;
    return {
      width: this.currentCanvas.width,
      height: this.currentCanvas.height
    };
  }

  /**
   * Get current canvas (if created)
   */
  getCurrentCanvas(): Canvas | null {
    return this.currentCanvas;
  }
}
