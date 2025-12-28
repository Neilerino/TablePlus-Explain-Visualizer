# PostgreSQL EXPLAIN Visualizer for TablePlus

A TablePlus plugin that visualizes PostgreSQL EXPLAIN query plans with an interactive D3.js tree diagram, making it easy to identify performance bottlenecks and optimization opportunities.

## Features

### 🎯 Interactive Visualization

- **D3.js tree layout** showing the complete query execution plan hierarchy
- **Color-coded nodes** indicating cost levels (green/orange/red)
- **Interactive tooltips** with comprehensive performance metrics on hover
- **Join conditions displayed on edges** between nodes
- **Performance warnings** for estimation mismatches

### 📊 Detailed Metrics

Each node shows:

- **Node type** (Seq Scan, Hash Join, Aggregate, etc.)
- **Strategy/Join type** (Hashed, Right Join, etc.)
- **Cost estimates** vs actual costs
- **Row estimates** vs actual rows
- **Execution timing** in milliseconds
- **Memory usage** for sorts and aggregates
- **Buffer statistics** (cache hits vs disk reads)

### ⚠️ Performance Debugging

The visualizer highlights:

- **Expensive operations** (red nodes for high cost)
- **Estimation problems** (purple nodes when planner estimates are off by >50%)
- **Seq scans** on large tables
- **Sort operations** with memory usage
- **Join conditions** and filter predicates
- **Cache effectiveness** (buffer hit rates)

## Installation

1. **Download or clone this repository**

   ```bash
   git clone <repository-url>
   ```

2. **Install the plugin**

   - Double-click `PostgresExplain.tableplusplugin`
   - Or manually copy to: `~/Library/Application Support/com.tinyapp.TablePlus/Plugins/`

3. **Reload TablePlus**
   - Restart TablePlus or reload plugins

## Usage

1. **Connect to a PostgreSQL database** in TablePlus

2. **Write or select a SQL query**

   ```sql
   SELECT u.email, COUNT(o.id) as order_count
   FROM users u
   LEFT JOIN orders o ON u.id = o.user_id
   GROUP BY u.email
   ORDER BY order_count DESC;
   ```

3. **Run EXPLAIN**

   - **Menu:** Plugins → Run Explain

4. **Explore the visualization**
   - Hover over nodes to see detailed metrics
   - Examine join conditions on the connecting edges
   - Look for purple warning nodes (estimation problems)
   - Check red nodes for expensive operations

## Understanding the Visualization

### Node Colors

- 🟢 **Green:** Low cost (< 100)
- 🟠 **Orange:** Moderate cost (100-1,000)
- 🔴 **Red:** High cost (> 1,000)
- 🟣 **Purple:** Estimation warning (planner was off by >50%)

### Node Information

**Displayed on node:**

- Node type (e.g., "Seq Scan", "Hash Join")
- Strategy/Table name (e.g., "Hashed", "users")
- Cost and row count
- Execution time (for expensive nodes)
- Warning indicator if estimates are off

**Tooltip sections:**

1. **Table Info:** Schema, table name, alias, index used
2. **Cost & Timing:** Total cost, startup cost, actual execution time
3. **Rows:** Planned vs actual rows, loops, estimation accuracy
4. **Join Conditions:** Hash conditions, join filters, uniqueness
5. **Sort Info:** Sort keys, method, memory usage
6. **Aggregate Info:** Strategy, group keys, hash buckets, memory
7. **Buffers:** Cache hits, disk reads, hit rate
8. **Filters:** Any filter conditions applied

### Edge Labels

Connecting lines between nodes show:

- **Join conditions** (e.g., `(o.user_id = u.id)`)
- **Parent relationships** (Outer, Inner)
- **Data flow direction** (top to bottom in the tree)

## Performance Optimization Tips

### Look for these warning signs:

1. **Purple "⚠ Est. Off" nodes**

   - Planner's row estimates are way off
   - May indicate outdated statistics → Run `ANALYZE`
   - Could lead to poor join strategy choices

2. **Red high-cost nodes**

   - Expensive operations that take most of the time
   - Consider adding indexes
   - Review join conditions and filters

3. **Seq Scan on large tables**

   - Scanning entire table instead of using index
   - Add appropriate indexes for WHERE/JOIN conditions

4. **Disk Reads in buffer stats**

   - Low cache hit rate
   - Data not in memory
   - Consider increasing `shared_buffers` or query less data

5. **High memory usage in sorts**

   - Sort operations spilling to disk
   - Consider increasing `work_mem`
   - Or optimize query to reduce sort size

6. **Nested Loop with high row count**
   - Can be very expensive for large datasets
   - Review join conditions
   - Consider restructuring query

Then try the commented queries at the bottom of the file to see various plan structures.

## Technical Details

### Technology Stack

- **Language:** Plain JavaScript (no build process required)
- **Visualization:** D3.js v7 (loaded from CDN)
- **Rendering:** TablePlus's built-in HTML viewer (`context.loadHTML()`)

### How It Works

1. Prepends `EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)` to your query
2. Executes the EXPLAIN query via TablePlus API
3. Parses the JSON output from PostgreSQL
4. Converts the plan tree to D3.js hierarchy format
5. Generates self-contained HTML with embedded visualization
6. Displays using TablePlus's HTML viewer

### Files

- `manifest.json` - Plugin configuration for TablePlus
- `explain.js` - Main plugin code with visualization generator

## Troubleshooting

### Plugin doesn't appear in menu

- Make sure you're connected to a **PostgreSQL** database (not MySQL, SQLite, etc.)
- Try restarting TablePlus
- Check that the plugin is installed in the correct directory

### "Invalid Query Type" error

- The plugin only works with `SELECT`, `INSERT`, `UPDATE`, `DELETE`, and `WITH` queries
- Remove any existing `EXPLAIN` from your query

### Visualization appears blank

- Check the browser console in TablePlus (if accessible)
- Ensure the query actually executed successfully
- Try a simpler query first to test

### Estimation warnings everywhere

- Run `ANALYZE` on your tables to update statistics
- Some warnings are expected for small tables or complex queries
- Focus on warnings on expensive nodes

## Contributing

Feel free to submit issues or pull requests for:

- Additional performance metrics to display
- Better visualization layouts
- Support for other database engines
- Bug fixes

## License

MIT License - feel free to modify and distribute

## Credits

- Built for [TablePlus](https://tableplus.com/)
- Visualization powered by [D3.js](https://d3js.org/)

---

**Happy optimizing! 🚀**
