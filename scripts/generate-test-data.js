/**
 * Generate transformed test data for development
 * Processes raw EXPLAIN output through the transformation pipeline
 */
import { transformToD3Tree } from '../src/core/transformer/tree-transformer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Raw test data
const rawTestData = {
  query: `SELECT
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
ORDER BY total_orders DESC;`,
  planData: [
    {
      "Plan": {
        "Node Type": "WindowAgg",
        "Parallel Aware": false,
        "Async Capable": false,
        "Startup Cost": 11.98,
        "Total Cost": 12.86,
        "Plan Rows": 50,
        "Plan Width": 85,
        "Actual Startup Time": 0.296,
        "Actual Total Time": 0.302,
        "Actual Rows": 4,
        "Actual Loops": 1,
        "Output": ["u.country", "(count(*))", "(sum((count(o.id))))", "(avg((COALESCE(sum(o.total_amount), '0'::numeric))))", "rank() OVER (?)"],
        "Shared Hit Blocks": 3,
        "Shared Read Blocks": 0,
        "Shared Dirtied Blocks": 0,
        "Shared Written Blocks": 0,
        "Local Hit Blocks": 0,
        "Local Read Blocks": 0,
        "Local Dirtied Blocks": 0,
        "Local Written Blocks": 0,
        "Temp Read Blocks": 0,
        "Temp Written Blocks": 0,
        "Plans": [
          {
            "Node Type": "Sort",
            "Parent Relationship": "Outer",
            "Parallel Aware": false,
            "Async Capable": false,
            "Startup Cost": 11.98,
            "Total Cost": 12.11,
            "Plan Rows": 50,
            "Plan Width": 77,
            "Actual Startup Time": 0.292,
            "Actual Total Time": 0.294,
            "Actual Rows": 4,
            "Actual Loops": 1,
            "Output": ["u.country", "(sum((count(o.id))))", "(count(*))", "(avg((COALESCE(sum(o.total_amount), '0'::numeric))))"],
            "Sort Key": ["(sum((count(o.id)))) DESC"],
            "Sort Method": "quicksort",
            "Sort Space Used": 25,
            "Sort Space Type": "Memory",
            "Shared Hit Blocks": 3,
            "Shared Read Blocks": 0,
            "Shared Dirtied Blocks": 0,
            "Shared Written Blocks": 0,
            "Local Hit Blocks": 0,
            "Local Read Blocks": 0,
            "Local Dirtied Blocks": 0,
            "Local Written Blocks": 0,
            "Temp Read Blocks": 0,
            "Temp Written Blocks": 0,
            "Plans": [
              {
                "Node Type": "Aggregate",
                "Strategy": "Hashed",
                "Partial Mode": "Simple",
                "Parent Relationship": "Outer",
                "Parallel Aware": false,
                "Async Capable": false,
                "Startup Cost": 9.82,
                "Total Cost": 10.57,
                "Plan Rows": 50,
                "Plan Width": 77,
                "Actual Startup Time": 0.254,
                "Actual Total Time": 0.258,
                "Actual Rows": 4,
                "Actual Loops": 1,
                "Output": ["u.country", "sum((count(o.id)))", "count(*)", "avg((COALESCE(sum(o.total_amount), '0'::numeric)))"],
                "Group Key": ["u.country"],
                "Planned Partitions": 0,
                "HashAgg Batches": 1,
                "Peak Memory Usage": 24,
                "Disk Usage": 0,
                "Shared Hit Blocks": 3,
                "Shared Read Blocks": 0,
                "Shared Dirtied Blocks": 0,
                "Shared Written Blocks": 0,
                "Local Hit Blocks": 0,
                "Local Read Blocks": 0,
                "Local Dirtied Blocks": 0,
                "Local Written Blocks": 0,
                "Temp Read Blocks": 0,
                "Temp Written Blocks": 0,
                "Plans": [
                  {
                    "Node Type": "Aggregate",
                    "Strategy": "Hashed",
                    "Partial Mode": "Simple",
                    "Parent Relationship": "Outer",
                    "Parallel Aware": false,
                    "Async Capable": false,
                    "Startup Cost": 8.19,
                    "Total Cost": 8.82,
                    "Plan Rows": 50,
                    "Plan Width": 49,
                    "Actual Startup Time": 0.220,
                    "Actual Total Time": 0.237,
                    "Actual Rows": 50,
                    "Actual Loops": 1,
                    "Output": ["u.country", "u.id", "count(o.id)", "COALESCE(sum(o.total_amount), '0'::numeric)"],
                    "Group Key": ["u.id"],
                    "Planned Partitions": 0,
                    "HashAgg Batches": 1,
                    "Peak Memory Usage": 48,
                    "Disk Usage": 0,
                    "Shared Hit Blocks": 3,
                    "Shared Read Blocks": 0,
                    "Shared Dirtied Blocks": 0,
                    "Shared Written Blocks": 0,
                    "Local Hit Blocks": 0,
                    "Local Read Blocks": 0,
                    "Local Dirtied Blocks": 0,
                    "Local Written Blocks": 0,
                    "Temp Read Blocks": 0,
                    "Temp Written Blocks": 0,
                    "Plans": [
                      {
                        "Node Type": "Hash Join",
                        "Parent Relationship": "Outer",
                        "Parallel Aware": false,
                        "Async Capable": false,
                        "Join Type": "Right",
                        "Startup Cost": 2.12,
                        "Total Cost": 6.69,
                        "Plan Rows": 200,
                        "Plan Width": 19,
                        "Actual Startup Time": 0.058,
                        "Actual Total Time": 0.138,
                        "Actual Rows": 201,
                        "Actual Loops": 1,
                        "Output": ["u.id", "u.country", "o.id", "o.total_amount"],
                        "Inner Unique": true,
                        "Hash Cond": "(o.user_id = u.id)",
                        "Shared Hit Blocks": 3,
                        "Shared Read Blocks": 0,
                        "Shared Dirtied Blocks": 0,
                        "Shared Written Blocks": 0,
                        "Local Hit Blocks": 0,
                        "Local Read Blocks": 0,
                        "Local Dirtied Blocks": 0,
                        "Local Written Blocks": 0,
                        "Temp Read Blocks": 0,
                        "Temp Written Blocks": 0,
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
                            "Total Cost": 4.00,
                            "Plan Rows": 200,
                            "Plan Width": 14,
                            "Actual Startup Time": 0.006,
                            "Actual Total Time": 0.027,
                            "Actual Rows": 200,
                            "Actual Loops": 1,
                            "Output": ["o.id", "o.user_id", "o.order_date", "o.total_amount", "o.status"],
                            "Shared Hit Blocks": 2,
                            "Shared Read Blocks": 0,
                            "Shared Dirtied Blocks": 0,
                            "Shared Written Blocks": 0,
                            "Local Hit Blocks": 0,
                            "Local Read Blocks": 0,
                            "Local Dirtied Blocks": 0,
                            "Local Written Blocks": 0,
                            "Temp Read Blocks": 0,
                            "Temp Written Blocks": 0
                          },
                          {
                            "Node Type": "Hash",
                            "Parent Relationship": "Inner",
                            "Parallel Aware": false,
                            "Async Capable": false,
                            "Startup Cost": 1.50,
                            "Total Cost": 1.50,
                            "Plan Rows": 50,
                            "Plan Width": 9,
                            "Actual Startup Time": 0.026,
                            "Actual Total Time": 0.027,
                            "Actual Rows": 50,
                            "Actual Loops": 1,
                            "Output": ["u.country", "u.id"],
                            "Hash Buckets": 1024,
                            "Original Hash Buckets": 1024,
                            "Hash Batches": 1,
                            "Original Hash Batches": 1,
                            "Peak Memory Usage": 11,
                            "Shared Hit Blocks": 1,
                            "Shared Read Blocks": 0,
                            "Shared Dirtied Blocks": 0,
                            "Shared Written Blocks": 0,
                            "Local Hit Blocks": 0,
                            "Local Read Blocks": 0,
                            "Local Dirtied Blocks": 0,
                            "Local Written Blocks": 0,
                            "Temp Read Blocks": 0,
                            "Temp Written Blocks": 0,
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
                                "Total Cost": 1.50,
                                "Plan Rows": 50,
                                "Plan Width": 9,
                                "Actual Startup Time": 0.007,
                                "Actual Total Time": 0.015,
                                "Actual Rows": 50,
                                "Actual Loops": 1,
                                "Output": ["u.country", "u.id"],
                                "Shared Hit Blocks": 1,
                                "Shared Read Blocks": 0,
                                "Shared Dirtied Blocks": 0,
                                "Shared Written Blocks": 0,
                                "Local Hit Blocks": 0,
                                "Local Read Blocks": 0,
                                "Local Dirtied Blocks": 0,
                                "Local Written Blocks": 0,
                                "Temp Read Blocks": 0,
                                "Temp Written Blocks": 0
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
          }
        ]
      },
      "Planning": {
        "Shared Hit Blocks": 10,
        "Shared Read Blocks": 0,
        "Shared Dirtied Blocks": 0,
        "Shared Written Blocks": 0,
        "Local Hit Blocks": 0,
        "Local Read Blocks": 0,
        "Local Dirtied Blocks": 0,
        "Local Written Blocks": 0,
        "Temp Read Blocks": 0,
        "Temp Written Blocks": 0
      },
      "Planning Time": 0.305,
      "Triggers": [],
      "Execution Time": 0.396
    }
  ]
};

// Extract plan data (first element from array)
const planData = rawTestData.planData[0];

// Transform through the pipeline
const transformedData = transformToD3Tree(planData);

// Create final test data matching the format sent to ExplainViz.init()
const testData = {
  query: rawTestData.query,
  planData: planData,
  treeData: transformedData.tree,
  criticalPath: transformedData.criticalPath,
  rootCost: transformedData.rootCost,
  rootTime: transformedData.rootTime
};

// Write to file
const outputPath = path.join(__dirname, '../app/test-data-transformed.json');
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

function countNodes(node) {
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }
  return count;
}
