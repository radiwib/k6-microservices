import http from 'k6/http';
import { check } from 'k6';
import { CONFIG } from '../config/configEnv.js';
import { assertStatus } from './checkers.js';
import { get } from './client.js';
import { loginDynamic, verifyOTPDynamic } from './authDynamic.js';

/**
 * Determines the base environment type from environment name
 * @param {string} environment - The environment name (e.g., 'stage', 'stagev1', 'prod', 'prodv1')
 * @returns {string} - The base environment type ('stage' or 'prod')
 */
function getBaseEnvironmentType(environment) {
    if (!environment) {
        return 'stage'; // default fallback
    }
    
    // Convert to lowercase for case-insensitive matching
    const envLower = environment.toLowerCase();
    
    // Check if it's a production environment variant
    if (envLower.startsWith('prod')) {
        return 'prod';
    }
    
    // Everything else defaults to stage (stage, stagev1, staging, dev, test, etc.)
    return 'stage';
}

export function getBikeId() {
    console.log('🔍 Retrieving bike ID for test...');
    
    // Get environment from K6 environment variable
    const environment = __ENV.ENVIRONMENT || 'stage';
    const baseEnvType = getBaseEnvironmentType(environment);
    
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🌍 Base environment type: ${baseEnvType}`);

    // Step 1: Authenticate to get access token
    let authData;
    try {
        console.log('🔐 Authenticating to get access token...');
        
        // Use dynamic authentication that automatically selects V1 or V2 based on environment
        console.log(`📱 Requesting login code (${baseEnvType} - ${environment})...`);
        loginDynamic(environment);
        console.log(`✅ Login code requested (${baseEnvType})`);
        
        console.log(`🔑 Verifying OTP (${baseEnvType})...`);
        authData = verifyOTPDynamic(environment);
        
        console.log('✅ Authentication successful!');
        console.log(`🎫 Access token obtained: ${authData.accessToken.substring(0, 20)}...`);
        
    } catch (error) {
        console.error(`❌ Authentication failed for environment '${environment}' (base: ${baseEnvType}): ${error}`);
        throw new Error(`Failed to authenticate for environment '${environment}': ${error}`);
    }

    // Step 2: Prepare headers with authentication token
    const headers = {
        'Authorization': `Bearer ${authData.accessToken}`,  // Uses 'Bearer <access_token>' format
        'Content-Type': 'application/json'
    };
    
    console.log(`📋 Request headers prepared with Authorization: Bearer ${authData.accessToken.substring(0, 20)}...`);
    console.log(`🔗 Requesting: ${CONFIG.urlBikes}${CONFIG.listBikesEndpoint}`);

    // Step 3: Make the authenticated request to get bike data
    const res = get(`${CONFIG.urlBikes}${CONFIG.listBikesEndpoint}`, headers);

    // Check the response status
    assertStatus(res, 200);
    if (res.status !== 200) {
        console.error(`❌ Failed to retrieve bike ID. Status: ${res.status}`);
        console.error(`Response body: ${res.body}`);
        return null;
    }

    // Parse and return the bike ID from the response
    const bikeData = res.json();
    if (!bikeData || !bikeData.data || !bikeData.data[0] || !bikeData.data[0].id) {
        console.error('❌ Bike ID not found in response');
        return null;
    }
    // Log the retrieved bike ID
    console.log(`✅ Bike ID retrieved: ${bikeData.data[0].id}`);
    
    // Assuming the first bike in the list is the one we want
    const bikeId = bikeData.data[0].id;

    return bikeId;
}