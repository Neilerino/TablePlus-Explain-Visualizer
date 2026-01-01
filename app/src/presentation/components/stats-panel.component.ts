/**
 * Stats Panel Component
 * Displays execution statistics from EXPLAIN plan
 * Display-only component - no controller needed
 */

import { Component } from './base.component';

interface StatItem {
  label: string;
  value: string | number;
}

export class StatsPanelComponent extends Component {
  constructor(container: HTMLElement) {
    super(container);
  }

  /**
   * Render method (required by base class)
   * Renders the stats from provided plan data
   */
  render(): void {
    // Stats are rendered when setStats is called
  }

  /**
   * Set and display execution statistics
   * @param planData - EXPLAIN plan data object
   */
  setStats(planData: any): void {
    const stats = this.extractStats(planData);
    this.renderStats(stats);
  }

  /**
   * Extract statistics from plan data
   */
  private extractStats(planData: any): StatItem[] {
    return [
      {
        label: 'Planning Time',
        value: this.formatTime(planData['Planning Time'])
      },
      {
        label: 'Execution Time',
        value: this.formatTime(planData['Execution Time'])
      },
      {
        label: 'Total Cost',
        value: this.formatNumber(planData.Plan?.['Total Cost'])
      },
      {
        label: 'Actual Rows',
        value: planData.Plan?.['Actual Rows'] ?? 'N/A'
      }
    ];
  }

  /**
   * Render stats items to the container
   */
  private renderStats(stats: StatItem[]): void {
    let html = '';
    for (const stat of stats) {
      html += `
        <div class="stat-item">
          <span class="stat-label">${stat.label}</span>
          <span class="stat-value">${stat.value}</span>
        </div>
      `;
    }

    // Find or create stats-items container to avoid clearing critical path toggle
    let statsItemsContainer = this.container.querySelector('.stats-items');
    if (!statsItemsContainer) {
      statsItemsContainer = document.createElement('div');
      statsItemsContainer.className = 'stats-items';
      this.container.insertBefore(statsItemsContainer, this.container.firstChild);
    }
    statsItemsContainer.innerHTML = html;
  }

  /**
   * Format time value
   */
  private formatTime(time: number | undefined): string {
    return time ? `${time.toFixed(3)} ms` : 'N/A';
  }

  /**
   * Format numeric value
   */
  private formatNumber(num: number | undefined): string {
    return num ? num.toFixed(2) : 'N/A';
  }

  /**
   * Clear stats display
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
