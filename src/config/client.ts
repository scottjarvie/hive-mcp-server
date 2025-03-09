// Hive client setup
import { Client } from '@hiveio/dhive';

// Create the client with multiple API nodes for redundancy
const client = new Client([
  'https://api.hive.blog',
  'https://api.hivekings.com',
  'https://anyx.io',
  'https://api.openhive.network',
]);

export default client;
