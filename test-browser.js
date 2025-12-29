/**
 * Browser test adapter
 * Generates standalone HTML file for debugging in Chrome
 */

import { transformToD3Tree } from './src/core/transformer/tree-transformer.js';
import { renderLayout } from './src/ui/sections/layout.js';
import { renderScripts } from './src/ui/sections/scripts.js';
import { escapeJson } from './src/utils/escape.js';
import { getTreeVisualizationCode } from './src/visualization/tree-renderer.js';
import { readFileSync, writeFileSync } from 'fs';

// Mock EXPLAIN plan data
const mockPlanData = {
  "Plan": {
    "Node Type": "Aggregate",
    "Strategy": "Sorted",
    "Partial Mode": "Simple",
    "Parallel Aware": false,
    "Async Capable": false,
    "Startup Cost": 16.88,
    "Total Cost": 16.90,
    "Plan Rows": 4,
    "Plan Width": 136,
    "Actual Startup Time": 0.393,
    "Actual Total Time": 0.395,
    "Actual Rows": 4,
    "Actual Loops": 1,
    "Output": ["country", "COUNT(*)", "sum((COALESCE(sum(o.total_amount), '0'::numeric)))", "avg((COALESCE(sum(o.total_amount), '0'::numeric)))", "rank() OVER (?)"],
    "Group Key": ["u.country", "u.id"],
    "Shared Hit Blocks": 11,
    "Shared Read Blocks": 0,
    "Shared Dirtied Blocks": 0,
    "Shared Written Blocks": 0,
    "Plans": [
      {
        "Node Type": "Sort",
        "Parent Relationship": "Outer",
        "Parallel Aware": false,
        "Async Capable": false,
        "Startup Cost": 16.77,
        "Total Cost": 16.78,
        "Plan Rows": 4,
        "Plan Width": 68,
        "Actual Startup Time": 0.380,
        "Actual Total Time": 0.381,
        "Actual Rows": 4,
        "Actual Loops": 1,
        "Output": ["u.country", "u.id", "(COALESCE(sum(o.total_amount), '0'::numeric))"],
        "Sort Key": ["(sum((COALESCE(sum(o.total_amount), '0'::numeric)))) DESC"],
        "Sort Method": "quicksort",
        "Sort Space Used": 25,
        "Sort Space Type": "Memory",
        "Shared Hit Blocks": 11,
        "Plans": [
          {
            "Node Type": "Hash Join",
            "Parent Relationship": "Outer",
            "Parallel Aware": false,
            "Join Type": "Left",
            "Async Capable": false,
            "Startup Cost": 2.08,
            "Total Cost": 16.69,
            "Plan Rows": 4,
            "Plan Width": 68,
            "Actual Startup Time": 0.042,
            "Actual Total Time": 0.368,
            "Actual Rows": 4,
            "Actual Loops": 1,
            "Output": ["u.country", "u.id", "o.total_amount"],
            "Inner Unique": false,
            "Hash Cond": "(u.id = o.user_id)",
            "Shared Hit Blocks": 11,
            "Plans": [
              {
                "Node Type": "Seq Scan",
                "Parent Relationship": "Outer",
                "Parallel Aware": false,
                "Async Capable": false,
                "Relation Name": "users",
                "Schema": "public",
                "Alias": "u",
                "Startup Cost": 0.00,
                "Total Cost": 1.04,
                "Plan Rows": 4,
                "Plan Width": 36,
                "Actual Startup Time": 0.008,
                "Actual Total Time": 0.009,
                "Actual Rows": 4,
                "Actual Loops": 1,
                "Output": ["u.id", "u.country"],
                "Shared Hit Blocks": 1
              },
              {
                "Node Type": "Hash",
                "Parent Relationship": "Inner",
                "Parallel Aware": false,
                "Async Capable": false,
                "Startup Cost": 2.04,
                "Total Cost": 2.04,
                "Plan Rows": 4,
                "Plan Width": 40,
                "Actual Startup Time": 0.028,
                "Actual Total Time": 0.029,
                "Actual Rows": 4,
                "Actual Loops": 1,
                "Output": ["o.user_id", "o.id", "o.total_amount"],
                "Hash Buckets": 1024,
                "Hash Batches": 1,
                "Peak Memory Usage": 9,
                "Shared Hit Blocks": 10,
                "Plans": [
                  {
                    "Node Type": "Aggregate",
                    "Strategy": "Hashed",
                    "Parent Relationship": "Outer",
                    "Partial Mode": "Simple",
                    "Parallel Aware": false,
                    "Async Capable": false,
                    "Startup Cost": 1.08,
                    "Total Cost": 2.04,
                    "Plan Rows": 4,
                    "Plan Width": 40,
                    "Actual Startup Time": 0.025,
                    "Actual Total Time": 0.026,
                    "Actual Rows": 4,
                    "Actual Loops": 1,
                    "Output": ["o.user_id", "o.id", "sum(o.total_amount)"],
                    "Group Key": ["o.user_id", "o.id"],
                    "Shared Hit Blocks": 10,
                    "Plans": [
                      {
                        "Node Type": "Seq Scan",
                        "Parent Relationship": "Outer",
                        "Parallel Aware": false,
                        "Async Capable": false,
                        "Relation Name": "orders",
                        "Schema": "public",
                        "Alias": "o",
                        "Startup Cost": 0.00,
                        "Total Cost": 1.04,
                        "Plan Rows": 4,
                        "Plan Width": 40,
                        "Actual Startup Time": 0.005,
                        "Actual Total Time": 0.006,
                        "Actual Rows": 4,
                        "Actual Loops": 1,
                        "Output": ["o.id", "o.user_id", "o.total_amount"],
                        "Shared Hit Blocks": 10
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "Planning Time": 0.427,
  "Execution Time": 0.447
};

const mockQuery = `SELECT
    country,
    COUNT(*) as user_count,
    SUM(order_count) as total_orders,
    AVG(total_spent) as avg_spent_per_user,
    RANK() OVER (ORDER BY SUM(order_count) DESC) as country_rank
FROM (
    SELECT
        u.country,
        u.id as user_id,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.country, u.id
) user_orders
GROUP BY country
ORDER BY total_orders DESC`;

console.log('Generating test HTML...');

// Transform plan to D3 tree
const treeData = transformToD3Tree(mockPlanData);
console.log('Tree data generated:', treeData);

// Get visualization code
const visualizationCode = getTreeVisualizationCode();
console.log('Visualization code length:', visualizationCode.length);

// Read CSS and bundled libraries manually
const styles = readFileSync('./src/styles/main.css', 'utf-8');
const d3Code = readFileSync('./src/libs/d3.bundled.js', 'utf-8');
const hljsCode = readFileSync('./src/libs/hljs.bundled.js', 'utf-8');

// Escape tree data for safe embedding
const treeJson = escapeJson(treeData);

// Build HTML manually (can't use renderHead due to import issues in Node)
const head = `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PostgreSQL EXPLAIN Visualization (Enhanced)</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script>${d3Code}</script>
  <script>${hljsCode}</script>
  <style>${styles}</style>
</head>
`;

const html = `<!DOCTYPE html>
<html lang="en">
${head}
${renderLayout(mockQuery, mockPlanData)}
${renderScripts(treeJson, visualizationCode)}
</html>`;

// Write to file
writeFileSync('test-output.html', html);
console.log('✅ Test HTML written to test-output.html');
console.log('📊 File size:', Math.round(html.length / 1024), 'KB');
console.log('🌐 Open test-output.html in Chrome to debug!');
