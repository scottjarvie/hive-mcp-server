// tests/env-reporter.js
class EnvReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunStart() {
    // Get environment requirements from Jest globals
    const requirements = global.ENV_REQUIREMENTS || {};
    const requiredVars = requirements.required || [];
    const recommendedVars = requirements.recommended || [];
    
    // Check for missing variables
    const missingRequired = requiredVars.filter(varName => !process.env[varName]);
    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    
    // Display formatted warnings for missing required variables
    if (missingRequired.length > 0) {
      console.log('\n');
      console.log('┌───────────────────────────────────────────────────┐');
      console.log('│  ⚠️  MISSING REQUIRED ENVIRONMENT VARIABLES  ⚠️   │');
      console.log('└───────────────────────────────────────────────────┘');
      console.log(`Tests requiring these variables will be skipped:`);
      missingRequired.forEach(v => console.log(`  - ${v}`));
      console.log('\n');
    }
    
    // Display formatted info for missing recommended variables
    if (missingRecommended.length > 0) {
      console.log('\n');
      console.log('┌───────────────────────────────────────────────────┐');
      console.log('│  ⓘ  MISSING RECOMMENDED ENVIRONMENT VARIABLES  ⓘ  │');
      console.log('└───────────────────────────────────────────────────┘');
      console.log(`Some tests may be skipped or limited:`);
      missingRecommended.forEach(v => console.log(`  - ${v}`));
      console.log('\n');
    }
  }

  // Other required reporter lifecycle methods (must be implemented)
  onRunComplete() {} 
  getLastError() {} 
}

module.exports = EnvReporter;
