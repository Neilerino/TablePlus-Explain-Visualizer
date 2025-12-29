/**
 * Setup zoom controls for the D3 visualization
 * @param {Object} d3 - D3 library
 * @param {Object} svgContainer - D3 selection of SVG container
 * @param {Object} svg - D3 selection of main SVG group
 * @param {Object} margin - Margin object with top, right, bottom, left properties
 * @returns {Object} zoom behavior object
 */
export function setupZoomControls(d3, svgContainer, svg, margin) {
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

  return zoom;
}
