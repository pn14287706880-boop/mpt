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

    // SQL Query
    const query = `
      with p as (select sku_name , safe_cast(pricing_default as float64) as price from (
      SELECT 
        sku_name, 
        pricing_default,
        price_start_time, 
        price_end_time,
        ROW_NUMBER() OVER (PARTITION BY sku_name ORDER BY price_start_time DESC) AS rnk
      FROM \`everyday-health-pro.BI_Reportings._any2any_db2bq_Databricks_listprices\`)
      where rnk=1)
      select u.year, u.year_mon, u.yyyymm, u.customTags_bu as bu, round(u.dbus * p.price,2) as usage_amount from (
      select FORMAT_DATETIME('%Y', safe_cast(usage_date as timestamp)) AS year, 
        FORMAT_DATETIME('%Y-%b', safe_cast(usage_date as timestamp)) AS year_mon, 
        FORMAT_DATETIME('%Y%m', safe_cast(usage_date as timestamp)) AS yyyymm,
        sku,coalesce(nullif(customTags_bu,''),'Undefined') as customTags_bu,
        sum(safe_cast(dbus as float64)) dbus
      from \`everyday-health-pro.BI_Reportings._any2any_db2bq_Databricks_usage\`
      group by 1,2,3,4,5) u 
      join p on u.sku=p.sku_name
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

