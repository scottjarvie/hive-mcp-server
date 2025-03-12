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

// Create a function to read environment variables
const readEnvConfig = (): HiveConfig => {
  return {
    username: process.env.HIVE_USERNAME,
    postingKey: process.env.HIVE_POSTING_KEY,
    activeKey: process.env.HIVE_ACTIVE_KEY,
    memoKey: process.env.HIVE_MEMO_KEY,
  };
};

// Default configuration
const defaultConfig: AppConfig = {
  hive: readEnvConfig(),
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

// Refresh the environment variables in the config
export const refreshEnvConfig = (): void => {
  defaultConfig.hive = readEnvConfig();
};

// Check if the authenticated operations are available
export const canPerformAuthenticatedOperations = (): boolean => {
  // Always read the latest environment values
  refreshEnvConfig();
  
  const { username, postingKey } = defaultConfig.hive;
  return Boolean(username && postingKey && validatePrivateKey(postingKey));
};

// Check if token transfers are available
export const canPerformTokenTransfers = (): boolean => {
  // Always read the latest environment values
  refreshEnvConfig();
  
  const { username, activeKey } = defaultConfig.hive;
  return Boolean(username && activeKey && validatePrivateKey(activeKey));
};

export default defaultConfig;
