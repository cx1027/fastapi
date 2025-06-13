import fs from 'fs';
import https from 'https';
import http from 'http';

const API_URL = 'http://0.0.0.0:8000/api/v1/openapi.json';
const OUTPUT_FILE = 'openapi.json';

const client = API_URL.startsWith('https') ? https : http;

client.get(API_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download OpenAPI schema: ${res.statusCode}`);
    process.exit(1);
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      // Parse and validate JSON
      const json = JSON.parse(data);
      // Write to file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(json, null, 2));
      console.log(`Successfully downloaded OpenAPI schema to ${OUTPUT_FILE}`);
    } catch (error) {
      console.error('Error processing OpenAPI schema:', error);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('Error downloading OpenAPI schema:', error);
  process.exit(1);
}); 