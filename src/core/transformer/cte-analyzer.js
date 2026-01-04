/**
 * CTE Analyzer
 * Analyzes tree structure to identify CTE definitions and references
 */

/**
 * Analyzes the enriched tree to extract CTE metadata
 * @param {Object} tree - The enriched tree root node
 * @returns {Object} CTEMetadata object with definitions and references
 */
export function analyzeCTEs(tree) {
  const cteDefinitions = new Map();
  const cteReferences = [];

  /**
   * Recursively traverse tree to find CTE definitions and references
   */
  function traverse(node) {
    if (!node) return;

    // Check for CTE definition (has subplanName starting with "CTE ")
    if (node.details?.subplanName && node.details.subplanName.startsWith('CTE ')) {
      const cteName = node.details.subplanName.substring(4); // Remove "CTE " prefix

      // Store CTE definition
      cteDefinitions.set(cteName, {
        cteName: cteName,
        rootNodeId: node.id,
        rootNode: node
      });
    }

    // Check for CTE Scan reference (name is "CTE Scan" and has cteName)
    if (node.name === 'CTE Scan' && node.details?.cteName) {
      const cteName = node.details.cteName;

      // Find the target CTE definition node ID
      const targetCTE = cteDefinitions.get(cteName);
      const targetCTENodeId = targetCTE ? targetCTE.rootNodeId : null;

      cteReferences.push({
        nodeId: node.id,
        cteName: cteName,
        targetCTENodeId: targetCTENodeId
      });
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => traverse(child));
    }
  }

  // Start traversal from root
  traverse(tree);

  // Second pass: Link any references that couldn't be linked in first pass
  // (in case references appear before definitions in tree traversal)
  cteReferences.forEach(ref => {
    if (!ref.targetCTENodeId) {
      const targetCTE = cteDefinitions.get(ref.cteName);
      if (targetCTE) {
        ref.targetCTENodeId = targetCTE.rootNodeId;
      }
    }
  });

  return {
    cteDefinitions,
    cteReferences
  };
}
