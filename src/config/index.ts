// Configuration manager for environment variables and settings
import { PrivateKey } from '@hiveio/dhive';

interface HiveConfig {
  username: string | undefined;
  postingKey: string | undefined;
  activeKey: string | undefined;
  memoKey: string | undefined;
  ownerKey?: string | undefined;
}

interface LogConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface ServerConfig {
  name: string;
  version: string;
}

interface AppConfig {
  hive: HiveConfig;
  server: ServerConfig;
  log: LogConfig;
}

// Default configuration
const defaultConfig: AppConfig = {
  hive: {
    username: process.env.HIVE_USERNAME,
    postingKey: process.env.HIVE_POSTING_KEY,
    activeKey: process.env.HIVE_ACTIVE_KEY,
    memoKey: process.env.HIVE_MEMO_KEY,
  },
  server: {
    name: 'HiveServer',
    version: '1.0.2',
  },
  log: {
    logLevel: 'info',
  },
};

// Validate a private key format (without logging the actual key)
export const validatePrivateKey = (key: string | undefined): boolean => {
  if (!key) return false;

  try {
    PrivateKey.fromString(key);
    return true;
  } catch (error) {
    return false;
  }
};

// Get the configuration
export const getConfig = (): AppConfig => {
  return defaultConfig;
};

// Check if the authenticated operations are available
export const canPerformAuthenticatedOperations = (): boolean => {
  const { username, postingKey } = defaultConfig.hive;
  return Boolean(username && postingKey && validatePrivateKey(postingKey));
};

// Check if token transfers are available
export const canPerformTokenTransfers = (): boolean => {
  const { username, activeKey } = defaultConfig.hive;
  return Boolean(username && activeKey && validatePrivateKey(activeKey));
};

export default defaultConfig;
