import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchDatabricksUsage() {
  try {
    console.log('Starting BigQuery data fetch...');

    // Initialize BigQuery client with service account
    // Path: scripts/ -> web/ -> mpt/ -> ai_dev/ -> github.com/ (4 levels up from scripts)
    const keyFilePath = path.resolve(__dirname, '../../../../everyday-health-pro.json');
    
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found at: ${keyFilePath}`);
    }

    // Load credentials from file
    const credentials = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

    const bigquery = new BigQuery({
      credentials,
      projectId: 'everyday-health-pro',
    });

    // SQL Query - Fetches current year and last year data (up to same date)
    const query = `
      WITH maxd AS (
        SELECT
          DATE(MAX(SAFE_CAST(usage_date AS TIMESTAMP))) AS max_date_this_year
        FROM \`everyday-health-pro.BI_Reportings._any2any_db2bq_Databricks_usage\`
        WHERE EXTRACT(YEAR FROM DATE(SAFE_CAST(usage_date AS TIMESTAMP))) = EXTRACT(YEAR FROM CURRENT_DATE())
      ),
      bounds AS (
        SELECT
          DATE_TRUNC(max_date_this_year, YEAR) AS start_cy,
          max_date_this_year AS end_cy,
          DATE_SUB(DATE_TRUNC(max_date_this_year, YEAR), INTERVAL 1 YEAR) AS start_ly,
          DATE_SUB(max_date_this_year, INTERVAL 1 YEAR) AS end_ly
        FROM maxd
      ),
      p AS (
        SELECT sku_name, SAFE_CAST(pricing_default AS FLOAT64) AS price
        FROM (
          SELECT
            sku_name,
            pricing_default,
            price_start_time,
            price_end_time,
            ROW_NUMBER() OVER (PARTITION BY sku_name ORDER BY price_start_time DESC) AS rnk
          FROM \`everyday-health-pro.BI_Reportings._any2any_db2bq_Databricks_listprices\`
        )
        WHERE rnk = 1
      ),
      u AS (
        SELECT
          FORMAT_DATE('%Y', DATE(SAFE_CAST(usage_date AS TIMESTAMP))) AS year,
          FORMAT_DATE('%Y-%b', DATE(SAFE_CAST(usage_date AS TIMESTAMP))) AS year_mon,
          FORMAT_DATE('%Y%m', DATE(SAFE_CAST(usage_date AS TIMESTAMP))) AS yyyymm,
          sku,
          COALESCE(NULLIF(customTags_bu, ''), 'Undefined') AS customTags_bu,
          SUM(SAFE_CAST(dbus AS FLOAT64)) AS dbus
        FROM \`everyday-health-pro.BI_Reportings._any2any_db2bq_Databricks_usage\` t
        CROSS JOIN bounds b
        WHERE 
          -- Current year data (up to max date)
          (DATE(SAFE_CAST(usage_date AS TIMESTAMP)) BETWEEN b.start_cy AND b.end_cy)
          OR 
          -- Last year data (up to same date as current year max)
          (DATE(SAFE_CAST(usage_date AS TIMESTAMP)) BETWEEN b.start_ly AND b.end_ly)
        GROUP BY 1,2,3,4,5
      )
      SELECT
        u.year,
        u.year_mon,
        u.yyyymm,
        CASE
          WHEN UPPER(u.customTags_bu) LIKE '%HEC%' THEN 'HEC'
          WHEN UPPER(u.customTags_bu) LIKE '%DATA_SCIENCE%' THEN 'DS'
          ELSE UPPER(u.customTags_bu)
        END AS bu,
        ROUND(u.dbus * p.price, 2) AS usage_amount
      FROM u
      JOIN p
        ON u.sku = p.sku_name
    `;

    console.log('Executing BigQuery...');
    const [rows] = await bigquery.query({ query });

    console.log(`Fetched ${rows.length} rows from BigQuery`);

    // Ensure the data directory exists
    const dataDir = path.resolve(__dirname, '../public/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write data to JSON file
    const outputPath = path.join(dataDir, 'databricks-usage.json');
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));

    console.log(`✓ Successfully saved data to: ${outputPath}`);
    console.log('Data fetch completed successfully!');
  } catch (error) {
    console.error('Error fetching Databricks usage data:');
    console.error(error.message);
    if (error.errors) {
      console.error('BigQuery errors:', error.errors);
    }
    process.exit(1);
  }
}

fetchDatabricksUsage();

