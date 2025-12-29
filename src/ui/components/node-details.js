/**
 * Node details component
 * Generates the detail panel HTML for a selected node
 */

/**
 * Create a detail section
 * @param {string} title - Section title
 * @param {Array} items - Array of {label, value, warning} objects
 * @returns {string} HTML string
 */
function createDetailSection(title, items) {
  if (!items || items.length === 0) return '';

  const itemsHtml = items.map(item => {
    const valueClass = item.warning ? 'detail-warning' : 'detail-value';
    return `
      <div class="detail-item">
        <span class="detail-label">${item.label}:</span>
        <span class="${valueClass}">${item.value}</span>
      </div>
    `;
  }).join('\n');

  return `
    <div class="detail-section">
      <div class="detail-section-title">${title}</div>
      ${itemsHtml}
    </div>
  `;
}

/**
 * Generate the function code that will run in the browser
 * to populate node details on click
 * @returns {string} JavaScript code
 */
export function getNodeDetailsPopulatorCode() {
  return `
    function populateNodeDetails(d) {
      let content = '<div class="detail-title">' + d.data.name;
      if (d.data.details.joinType) {
        content += ' <span style="color: #858585;">(' + d.data.details.joinType + ' Join)</span>';
      }
      content += '</div>';

      // Table/Relation info
      if (d.data.details.relation) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Table Info</div>';
        if (d.data.details.schema) {
          content += '<div class="detail-item"><span class="detail-label">Schema:</span> <span class="detail-value">' + d.data.details.schema + '</span></div>';
        }
        content += '<div class="detail-item"><span class="detail-label">Table:</span> <span class="detail-value">' + d.data.details.relation + '</span></div>';
        if (d.data.details.alias) {
          content += '<div class="detail-item"><span class="detail-label">Alias:</span> <span class="detail-value">' + d.data.details.alias + '</span></div>';
        }
        if (d.data.details.indexName) {
          content += '<div class="detail-item"><span class="detail-label">Index:</span> <span class="detail-value">' + d.data.details.indexName + '</span></div>';
        }
        content += '</div>';
      }

      // Cost & Timing
      content += '<div class="detail-section">';
      content += '<div class="detail-section-title">Cost & Timing</div>';
      content += '<div class="detail-item"><span class="detail-label">Total Cost:</span> <span class="detail-value">' + d.data.details.cost + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Startup Cost:</span> <span class="detail-value">' + d.data.details.startupCost + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Actual Time:</span> <span class="detail-value">' + d.data.details.actualTime + ' ms</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Startup Time:</span> <span class="detail-value">' + d.data.details.startupTime + ' ms</span></div>';
      content += '</div>';

      // Rows & Estimation
      content += '<div class="detail-section">';
      content += '<div class="detail-section-title">Rows</div>';
      content += '<div class="detail-item"><span class="detail-label">Plan Rows:</span> <span class="detail-value">' + d.data.details.planRows + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Actual Rows:</span> <span class="detail-value">' + d.data.details.actualRows + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Loops:</span> <span class="detail-value">' + d.data.details.loops + '</span></div>';
      if (d.data.details.estimationOff) {
        const accuracy = d.data.details.estimationAccuracy;
        content += '<div class="detail-item"><span class="detail-warning">⚠ Estimation Off: ' + (accuracy < 1 ? 'underestimated' : 'overestimated') + ' by ' + (Math.abs(1 - accuracy) * 100).toFixed(0) + '%</span></div>';
      }
      content += '</div>';

      // Join Conditions
      if (d.data.details.hashCond || d.data.details.joinFilter) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Join Conditions</div>';
        if (d.data.details.hashCond) {
          content += '<div class="detail-item"><span class="detail-label">Hash Cond:</span> <span class="detail-value">' + d.data.details.hashCond + '</span></div>';
        }
        if (d.data.details.joinFilter) {
          content += '<div class="detail-item"><span class="detail-label">Join Filter:</span> <span class="detail-value">' + d.data.details.joinFilter + '</span></div>';
        }
        if (d.data.details.innerUnique !== null) {
          content += '<div class="detail-item"><span class="detail-label">Inner Unique:</span> <span class="detail-value">' + d.data.details.innerUnique + '</span></div>';
        }
        content += '</div>';
      }

      // Sort Info
      if (d.data.details.sortKey) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Sort Info</div>';
        content += '<div class="detail-item"><span class="detail-label">Sort Key:</span> <span class="detail-value">' + d.data.details.sortKey + '</span></div>';
        if (d.data.details.sortMethod) {
          content += '<div class="detail-item"><span class="detail-label">Method:</span> <span class="detail-value">' + d.data.details.sortMethod + '</span></div>';
        }
        if (d.data.details.sortSpaceUsed) {
          content += '<div class="detail-item"><span class="detail-label">Space:</span> <span class="detail-value">' + d.data.details.sortSpaceUsed + ' kB (' + d.data.details.sortSpaceType + ')</span></div>';
        }
        content += '</div>';
      }

      // Aggregate/Hash Info
      if (d.data.details.strategy || d.data.details.groupKey) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Aggregate Info</div>';
        if (d.data.details.strategy) {
          content += '<div class="detail-item"><span class="detail-label">Strategy:</span> <span class="detail-value">' + d.data.details.strategy + '</span></div>';
        }
        if (d.data.details.groupKey) {
          content += '<div class="detail-item"><span class="detail-label">Group Key:</span> <span class="detail-value">' + d.data.details.groupKey + '</span></div>';
        }
        if (d.data.details.peakMemoryUsage) {
          content += '<div class="detail-item"><span class="detail-label">Peak Memory:</span> <span class="detail-value">' + d.data.details.peakMemoryUsage + ' kB</span></div>';
        }
        if (d.data.details.hashAggBatches) {
          content += '<div class="detail-item"><span class="detail-label">Hash Batches:</span> <span class="detail-value">' + d.data.details.hashAggBatches + '</span></div>';
        }
        if (d.data.details.hashBuckets) {
          content += '<div class="detail-item"><span class="detail-label">Hash Buckets:</span> <span class="detail-value">' + d.data.details.hashBuckets + '</span></div>';
        }
        content += '</div>';
      }

      // Parallel Query Info
      if (d.data.details.workersPlanned || d.data.details.workersLaunched) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Parallel Execution</div>';
        if (d.data.details.workersPlanned) {
          content += '<div class="detail-item"><span class="detail-label">Workers Planned:</span> <span class="detail-value">' + d.data.details.workersPlanned + '</span></div>';
        }
        if (d.data.details.workersLaunched) {
          content += '<div class="detail-item"><span class="detail-label">Workers Launched:</span> <span class="detail-value">' + d.data.details.workersLaunched + '</span></div>';
        }
        content += '</div>';
      }

      // Filter & Selectivity
      if (d.data.details.filter || d.data.details.rowsRemovedByFilter !== null) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Filter</div>';
        if (d.data.details.filter) {
          content += '<div class="detail-item"><span class="detail-label">Condition:</span> <span class="detail-value">' + d.data.details.filter + '</span></div>';
        }
        if (d.data.details.rowsRemovedByFilter !== null) {
          content += '<div class="detail-item"><span class="detail-label">Rows Removed:</span> <span class="detail-value">' + d.data.details.rowsRemovedByFilter + '</span></div>';
          const totalRows = d.data.details.actualRows + d.data.details.rowsRemovedByFilter;
          const selectivity = totalRows > 0 ? ((d.data.details.actualRows / totalRows) * 100).toFixed(1) : 0;
          content += '<div class="detail-item"><span class="detail-label">Selectivity:</span> <span class="detail-value">' + selectivity + '%</span></div>';
        }
        if (d.data.details.rowsRemovedByJoinFilter !== null) {
          content += '<div class="detail-item"><span class="detail-label">Rows Removed (Join):</span> <span class="detail-value">' + d.data.details.rowsRemovedByJoinFilter + '</span></div>';
        }
        content += '</div>';
      }

      // Index-Specific Info
      if (d.data.details.heapFetches || d.data.details.exactHeapBlocks || d.data.details.lossyHeapBlocks) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Index Scan Details</div>';
        if (d.data.details.heapFetches) {
          content += '<div class="detail-item"><span class="detail-label">Heap Fetches:</span> <span class="detail-value">' + d.data.details.heapFetches + '</span></div>';
        }
        if (d.data.details.exactHeapBlocks) {
          content += '<div class="detail-item"><span class="detail-label">Exact Heap Blocks:</span> <span class="detail-value">' + d.data.details.exactHeapBlocks + '</span></div>';
        }
        if (d.data.details.lossyHeapBlocks) {
          content += '<div class="detail-item"><span class="detail-label">Lossy Heap Blocks:</span> <span class="detail-value">' + d.data.details.lossyHeapBlocks + '</span></div>';
        }
        content += '</div>';
      }

      // Buffer Info
      const hasBufferInfo = d.data.details.sharedHitBlocks > 0 ||
                           d.data.details.sharedReadBlocks > 0 ||
                           d.data.details.sharedDirtiedBlocks > 0 ||
                           d.data.details.sharedWrittenBlocks > 0 ||
                           d.data.details.localHitBlocks > 0 ||
                           d.data.details.localReadBlocks > 0 ||
                           d.data.details.tempReadBlocks > 0 ||
                           d.data.details.tempWrittenBlocks > 0;

      if (hasBufferInfo) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Buffers</div>';
        if (d.data.details.sharedHitBlocks > 0 || d.data.details.sharedReadBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Shared Hit:</span> <span class="detail-value">' + d.data.details.sharedHitBlocks + ' blocks</span></div>';
          content += '<div class="detail-item"><span class="detail-label">Shared Read:</span> <span class="detail-value">' + d.data.details.sharedReadBlocks + ' blocks</span></div>';
          if (d.data.details.sharedReadBlocks > 0) {
            const hitRate = (d.data.details.sharedHitBlocks / (d.data.details.sharedHitBlocks + d.data.details.sharedReadBlocks) * 100).toFixed(1);
            content += '<div class="detail-item"><span class="detail-label">Cache Hit Rate:</span> <span class="detail-value">' + hitRate + '%</span></div>';
          }
        }
        if (d.data.details.sharedDirtiedBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Shared Dirtied:</span> <span class="detail-value">' + d.data.details.sharedDirtiedBlocks + ' blocks</span></div>';
        }
        if (d.data.details.sharedWrittenBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Shared Written:</span> <span class="detail-value">' + d.data.details.sharedWrittenBlocks + ' blocks</span></div>';
        }
        if (d.data.details.localHitBlocks > 0 || d.data.details.localReadBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Local Hit:</span> <span class="detail-value">' + d.data.details.localHitBlocks + ' blocks</span></div>';
          content += '<div class="detail-item"><span class="detail-label">Local Read:</span> <span class="detail-value">' + d.data.details.localReadBlocks + ' blocks</span></div>';
        }
        if (d.data.details.tempReadBlocks > 0 || d.data.details.tempWrittenBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Temp Read:</span> <span class="detail-value">' + d.data.details.tempReadBlocks + ' blocks</span></div>';
          content += '<div class="detail-item"><span class="detail-label">Temp Written:</span> <span class="detail-value">' + d.data.details.tempWrittenBlocks + ' blocks</span></div>';
        }
        content += '</div>';
      }

      // I/O Timing
      if (d.data.details.ioReadTime !== null || d.data.details.ioWriteTime !== null) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">I/O Timing</div>';
        if (d.data.details.ioReadTime !== null) {
          content += '<div class="detail-item"><span class="detail-label">Read Time:</span> <span class="detail-value">' + d.data.details.ioReadTime.toFixed(3) + ' ms</span></div>';
        }
        if (d.data.details.ioWriteTime !== null) {
          content += '<div class="detail-item"><span class="detail-label">Write Time:</span> <span class="detail-value">' + d.data.details.ioWriteTime.toFixed(3) + ' ms</span></div>';
        }
        content += '</div>';
      }

      // Output Columns
      if (d.data.details.output) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Output</div>';
        content += '<div class="detail-item"><pre style="margin: 0; background: #282c34; padding: 8px; border-radius: 4px; overflow-x: auto;"><code class="language-sql" style="font-size: 11px;">' + d.data.details.output + '</code></pre></div>';
        content += '</div>';
      }

      document.getElementById('nodeDetails').innerHTML = content;

      // Apply syntax highlighting if available
      if (d.data.details.output && typeof hljs !== 'undefined') {
        document.querySelectorAll('#nodeDetails code.language-sql').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    }
  `;
}
