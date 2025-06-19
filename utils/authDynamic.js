import { CONFIG } from '../config/configEnv.js';
import * as authV1 from './authV1.js';
import * as authV2 from './authV2.js';

/**
 * Determines the authentication version to use based on environment
 * @param {string} environment - The environment name (e.g., 'stage', 'stagev1', 'prod', 'prodv1')
 * @returns {string} - The auth version to use ('V1' or 'V2')
 */
function getAuthVersion(environment) {
    if (!environment) {
        return 'V2'; // default fallback
    }
    
    // Convert to lowercase for case-insensitive matching
    const envLower = environment.toLowerCase();
    
    // Use V1 for environments ending with 'v1' (stagev1, prodv1)
    if (envLower.endsWith('v1')) {
        return 'V1';
    }
    
    // Use V2 for everything else (stage, prod, dev, test, etc.)
    return 'V2';
}

/**
 * Returns the appropriate authentication module based on environment
 * @param {string} environment - The environment name
 * @returns {object} - The authentication module with login and verifyOTP functions
 */
function getAuthModule(environment) {
    const authVersion = getAuthVersion(environment);
    console.log(`🔧 Using authentication version: ${authVersion} for environment: ${environment}`);
    
    if (authVersion === 'V1') {
        return {
            login: authV1.login,
            verifyOTP: authV1.verifyOTP
        };
    } else {
        return {
            login: authV2.login,
            verifyOTP: authV2.verifyOTP
        };
    }
}

/**
 * Performs login request using the appropriate auth version for the environment
 * @param {string} environment - The environment name (optional, uses __ENV.ENVIRONMENT if not provided)
 * @returns {object} - The login response
 */
export function loginDynamic(environment = null) {
    const env = environment || __ENV.ENVIRONMENT || 'stage';
    const authModule = getAuthModule(env);
    console.log(`🔐 Performing login for environment: ${env}`);
    return authModule.login();
}

/**
 * Performs OTP verification using the appropriate auth version for the environment
 * @param {string} environment - The environment name (optional, uses __ENV.ENVIRONMENT if not provided)
 * @returns {object} - The authentication data with tokens
 */
export function verifyOTPDynamic(environment = null) {
    const env = environment || __ENV.ENVIRONMENT || 'stage';
    const authModule = getAuthModule(env);
    console.log(`🔑 Performing OTP verification for environment: ${env}`);
    return authModule.verifyOTP();
}

/**
 * Utility function to get auth version for debugging/logging
 * @param {string} environment - The environment name
 * @returns {string} - The auth version that would be used
 */
export function getAuthVersionForEnvironment(environment = null) {
    // If environment is explicitly passed (even if null), use it as-is
    // If no argument is passed (undefined), fall back to __ENV.ENVIRONMENT
    const env = environment !== undefined ? environment : (__ENV.ENVIRONMENT || 'stage');
    return getAuthVersion(env);
}

