/**
 * Render nodes in the tree visualization
 * @param {Object} d3 - D3 library
 * @param {Object} svg - D3 selection of main SVG group
 * @param {Object} treeLayout - D3 tree layout with data
 * @param {number} nodeWidth - Width of nodes
 * @param {number} nodeHeight - Height of nodes
 * @param {Function} onNodeClick - Click handler for nodes
 */
export function renderNodes(d3, svg, treeLayout, nodeWidth, nodeHeight, onNodeClick) {
  // Draw nodes
  const nodes = svg.selectAll('.node')
    .data(treeLayout.descendants())
    .enter()
    .append('g')
    .attr('class', d => {
      let className = 'node';
      const cost = parseFloat(d.data.details.cost);

      // Color based on cost
      if (cost > 1000) {
        className += ' expensive';
      } else if (cost > 100) {
        className += ' moderate';
      }

      return className;
    })
    .attr('transform', d => {
      const tx = d.x - nodeWidth/2;
      const ty = d.y;
      return 'translate(' + tx + ',' + ty + ')';
    });

  // Add rectangles with click handler
  nodes.append('rect')
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .on('click', onNodeClick);

  // Node Type (title)
  nodes.append('text')
    .attr('x', nodeWidth / 2)
    .attr('y', 18)
    .attr('class', 'node-type')
    .attr('text-anchor', 'middle')
    .text(d => d.data.name);

  // Alias/Table (subtitle)
  nodes.append('text')
    .attr('x', nodeWidth / 2)
    .attr('y', 32)
    .attr('class', 'node-alias')
    .attr('text-anchor', 'middle')
    .text(d => {
      if (d.data.details.joinType) return d.data.details.joinType + ' Join';
      if (d.data.details.strategy) return d.data.details.strategy;
      if (d.data.details.alias) return d.data.details.alias;
      if (d.data.details.relation) return d.data.details.relation;
      return '';
    });

  // Cost metric
  nodes.append('text')
    .attr('x', 8)
    .attr('y', 52)
    .attr('class', 'node-metric')
    .text(d => 'Cost: ' + d.data.details.cost);

  // Rows metric
  nodes.append('text')
    .attr('x', 8)
    .attr('y', 65)
    .attr('class', 'node-metric')
    .text(d => 'Rows: ' + d.data.details.actualRows);

  // Time metric
  nodes.append('text')
    .attr('x', 8)
    .attr('y', 78)
    .attr('class', 'node-metric')
    .text(d => {
      if (d.data.details.actualTime !== 'N/A') {
        return 'Time: ' + d.data.details.actualTime + ' ms';
      }
      return 'Time: N/A';
    });

  // Estimation warning (if applicable)
  nodes.filter(d => d.data.details.estimationOff)
    .append('text')
    .attr('x', nodeWidth - 8)
    .attr('y', 52)
    .attr('text-anchor', 'end')
    .attr('class', 'node-metric')
    .style('fill', '#ff9800')
    .text('⚠');
}
