import { sleep } from 'k6';
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
            verifyOTP: authV1.verifyOTP,
            getToken: authV1.getToken
        };
    } else {
        return {
            login: authV2.login,
            verifyOTP: authV2.verifyOTP,
            getToken: authV2.getToken
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

/** Get the token for the current environment
 * This function will use the appropriate auth version based on the environment
 */
export function getToken() {
    console.log('🔐 Acquiring token for test...');
    console.log('📋 Auth configuration:');
    console.log(`- USER_URL: ${CONFIG.urlUsers}`);
    console.log(`- PHONE: ${CONFIG.phone}`);
    console.log(`- TYPE: ${CONFIG.type}`);
    console.log(`- LOGIN_REQUEST_ENDPOINT: ${CONFIG.loginRequestEndpoint}`);
    console.log(`- VERIFY_LOGIN_ENDPOINT: ${CONFIG.verifyLoginEndpoint}`);
    console.log(`- CODE: ${CONFIG.code}`);

    try {
        // Step 1: Request OTP
        console.log('📱 Requesting OTP code...');
        const loginResponse = loginDynamic();

        if (!loginResponse) {
            console.error('❌ Login response is null or undefined');
            return null;
        }

        if (loginResponse.status !== 200) {
            console.error(`❌ Failed to request OTP. Status: ${loginResponse.status}`);
            console.error(`Response body: ${JSON.stringify(loginResponse.body || {})}`);
            return null;
        }

        console.log('✅ OTP request successful');
        sleep(1); // Small delay between requests

        // Step 2: Verify OTP to get token
        console.log('🔑 Verifying OTP code...');
        try {
            const verifyResponse = verifyOTPDynamic();

            if (!verifyResponse) {
                console.error('❌ Verify OTP response is null or undefined');
                return null;
            }

            if (!verifyResponse.accessToken) {
                console.error('❌ No access token in verify response');
                console.error(`Response data: ${JSON.stringify(verifyResponse)}`);
                return null;
            }

            console.log('✅ Token acquired successfully');
            const accessToken = verifyResponse.accessToken;
            console.log(`Access Token: ${accessToken}`);
            return accessToken;
        } catch (verifyError) {
            console.error(`❌ Error during OTP verification: ${verifyError.message || verifyError}`);
            if (verifyError.response) {
                console.error(`Response status: ${verifyError.response.status}`);
                console.error(`Content-Type: ${verifyError.response.headers['Content-Type'] || 'unknown'}`);

                try {
                    // Try to parse as JSON first
                    const jsonBody = JSON.parse(verifyError.response.body);
                    console.error(`Response body (JSON): ${JSON.stringify(jsonBody)}`);
                } catch (parseError) {
                    // If not JSON, log as text
                    console.error(`Response body (text): ${verifyError.response.body}`);
                    console.error(`Response body is not valid JSON: ${parseError.message}`);
                }
            }
            return null;
        }
    } catch (error) {
        console.error(`❌ Error in authentication flow: ${error.message || error}`);
        console.error(`Stack trace: ${error.stack || 'No stack trace'}`);
        return null;
    }
}