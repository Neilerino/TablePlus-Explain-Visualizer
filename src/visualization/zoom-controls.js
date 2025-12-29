/**
 * Generate zoom controls code
 * @returns {string} JavaScript code for zoom controls
 */
export function getZoomControlsCode() {
  return `
  // Set up zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4]) // Min zoom: 10%, Max zoom: 400%
    .on('zoom', (event) => {
      svg.attr('transform', 'translate(' + margin.left + ',' + margin.top + ') ' + event.transform);
    });

  // Apply zoom to SVG
  svgContainer.call(zoom);

  // Zoom control buttons
  document.getElementById('zoom-in').addEventListener('click', () => {
    svgContainer.transition().duration(300).call(zoom.scaleBy, 1.3);
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    svgContainer.transition().duration(300).call(zoom.scaleBy, 0.7);
  });

  document.getElementById('zoom-reset').addEventListener('click', () => {
    svgContainer.transition().duration(300).call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));
  });
  `;
}
