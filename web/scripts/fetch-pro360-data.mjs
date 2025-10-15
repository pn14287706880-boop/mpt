import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchPro360Data() {
  try {
    console.log('Starting Pro360 BigQuery data fetch...');

    // Detect environment and set correct path for service account key
    const hostname = os.hostname();
    const isProductionServer = hostname.includes("bidevlspark02");

    // Use absolute path on server, relative path in development
    const keyFilePath = isProductionServer
      ? "/home/go_projects/src/github.com/everyday-health-pro.json"
      : path.resolve(__dirname, '../../../../everyday-health-pro.json');

    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found at: ${keyFilePath}`);
    }

    // Load credentials from file
    const credentials = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

    const bigquery = new BigQuery({
      credentials,
      projectId: 'everyday-health-pro',
    });

    // SQL Query from user requirements
    const query = `
      SELECT
        CustomSolutionID,
        TacticKey,
        CampaignNickName,
        TacticType,
        format_date('%Y-%m',ActivityDate) yearmonth,
        ActivityDate,
        BillingType,
        sum(a.lme) lme,
        sum(a.nlme) nlme,
        sum(a.lmx) lmx,
        sum(a.nlmx) nlmx,
        sum(a.lmpv) lmpv,
        sum(a.nlmpv) nlmpv
      FROM \`everyday-health-pro.BI_Gold.pro360\`, unnest(activity) a
      WHERE ActivityDate >= "2024-01-01"
      GROUP BY 1,2,3,4,5,6,7
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
    const outputPath = path.join(dataDir, 'pro360-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));

    console.log(`✓ Successfully saved data to: ${outputPath}`);
    console.log('Pro360 data fetch completed successfully!');
  } catch (error) {
    console.error('Error fetching Pro360 data:');
    console.error(error.message);
    if (error.errors) {
      console.error('BigQuery errors:', error.errors);
    }
    process.exit(1);
  }
}

fetchPro360Data();
