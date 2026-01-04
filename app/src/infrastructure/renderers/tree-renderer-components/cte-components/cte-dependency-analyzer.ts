/**
 * CTE Dependency Analyzer
 * Analyzes CTE dependencies and arranges them into layers using topological sort
 */

export class CTEDependencyAnalyzer {
  /**
   * Analyze CTE dependencies and arrange into layers using topological sort
   * CTEs with no dependencies go in layer 0, CTEs that depend on layer 0 go in layer 1, etc.
   */
  analyzeDependencies(cteTrees: any[], cteReferences: any[]): string[][] {
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
}
