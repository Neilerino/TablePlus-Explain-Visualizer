/**
 * Generate link rendering code
 * @returns {string} JavaScript code for link rendering
 */
export function getLinkRendererCode() {
  return `
  // Draw links (edges connecting nodes)
  const links = svg.selectAll('.link')
    .data(treeLayout.links())
    .enter()
    .append('g');

  links.append('path')
    .attr('class', 'link')
    .attr('d', d => {
      // Custom path to connect bottom of parent to top of child
      return d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y)({
          source: {x: d.source.x, y: d.source.y + nodeHeight},
          target: {x: d.target.x, y: d.target.y}
        });
    });

  // Add edge labels (join conditions, etc.)
  links.each(function(d) {
    if (d.target.data.edgeLabel) {
      const midX = (d.source.x + d.target.x) / 2;
      const midY = (d.source.y + nodeHeight + d.target.y) / 2;

      d3.select(this)
        .append('text')
        .attr('class', 'edge-label')
        .attr('x', midX + 10)
        .attr('y', midY)
        .text(d.target.data.edgeLabel.length > 50 ?
              d.target.data.edgeLabel.substring(0, 50) + '...' :
              d.target.data.edgeLabel);
    }
  });
  `;
}
