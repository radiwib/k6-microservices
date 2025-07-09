// Endpoint tracking utility for k6 tests
// This module tracks all endpoints tested during a test run

import { Trend } from 'k6/metrics';

// Create a custom metric to store endpoint data
const endpointMetric = new Trend('endpoint_data', false);

// Store endpoint data in a format that can be serialized
let endpointTracker = {
    endpoints: [],
    testName: '',
    testType: '',
    endpointMap: new Map() // For deduplication
};

// For storing in handleSummary context
let storedEndpointData = null;

/**
 * Initialize the endpoint tracker for a test session
 * @param {string} testName - Name of the test being run
 * @param {string} testType - Type of test ('test' or 'stress')
 */
export function initEndpointTracker(testName, testType = 'test') {
    // Only initialize once - avoid reinitializing for each VU
    if (!endpointTracker.testName) {
        endpointTracker.testName = testName;
        endpointTracker.testType = testType;
        endpointTracker.endpoints = [];
        console.log(`📋 Endpoint tracker initialized for: ${testName} (${testType})`);
    }
}

/**
 * Track an endpoint that was tested
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} baseUrl - Base URL of the service
 * @param {string} endpoint - Endpoint path
 * @param {string} description - Description of what this endpoint does
 * @param {number} statusCode - Response status code received
 */
export function trackEndpoint(method, baseUrl, endpoint, description = '', statusCode = null) {
    const fullUrl = `${baseUrl}${endpoint}`;
    
    // Check if this endpoint is already tracked
    const existingIndex = endpointTracker.endpoints.findIndex(e => 
        e.method === method && e.fullUrl === fullUrl
    );
    
    if (existingIndex !== -1) {
        // Update existing endpoint with new status code if provided
        if (statusCode !== null) {
            endpointTracker.endpoints[existingIndex].statusCodes.push(statusCode);
        }
        endpointTracker.endpoints[existingIndex].callCount++;
    } else {
        // Add new endpoint
        endpointTracker.endpoints.push({
            method: method.toUpperCase(),
            baseUrl: baseUrl,
            endpoint: endpoint,
            fullUrl: fullUrl,
            description: description,
            statusCodes: statusCode !== null ? [statusCode] : [],
            callCount: 1
        });
    }
    
    console.log(`🔗 Tracked endpoint: ${method.toUpperCase()} ${fullUrl}`);
}

/**
 * Get all tracked endpoints
 * @returns {object} Object containing test info and endpoints
 */
export function getTrackedEndpoints() {
    return {
        testName: endpointTracker.testName,
        testType: endpointTracker.testType,
        endpoints: endpointTracker.endpoints,
        totalEndpoints: endpointTracker.endpoints.length,
        totalCalls: endpointTracker.endpoints.reduce((sum, ep) => sum + ep.callCount, 0)
    };
}

/**
 * Clear all tracked endpoints (useful for test isolation)
 */
export function clearTrackedEndpoints() {
    endpointTracker.endpoints = [];
    console.log('🧹 Endpoint tracker cleared');
}

/**
 * Get endpoints grouped by service/base URL
 * @returns {object} Endpoints grouped by base URL
 */
export function getEndpointsByService() {
    const grouped = {};
    
    endpointTracker.endpoints.forEach(ep => {
        if (!grouped[ep.baseUrl]) {
            grouped[ep.baseUrl] = [];
        }
        grouped[ep.baseUrl].push(ep);
    });
    
    return grouped;
}

/**
 * Generate a formatted string of all tracked endpoints
 * @returns {string} Formatted endpoint list
 */
export function formatEndpointList() {
    if (endpointTracker.endpoints.length === 0) {
        return 'No endpoints tracked';
    }
    
    const groupedByService = getEndpointsByService();
    let output = '';
    
    Object.keys(groupedByService).forEach(baseUrl => {
        output += `\n  Service: ${baseUrl}\n`;
        groupedByService[baseUrl].forEach(ep => {
            const statusCodesStr = ep.statusCodes.length > 0 ? 
                ` (Status: ${[...new Set(ep.statusCodes)].join(', ')})` : '';
            const callCountStr = ep.callCount > 1 ? ` [${ep.callCount} calls]` : '';
            output += `    ${ep.method} ${ep.endpoint}${statusCodesStr}${callCountStr}\n`;
            if (ep.description) {
                output += `      → ${ep.description}\n`;
            }
        });
    });
    
    return output;
}

/**
 * Convenience function to track authentication endpoints
 * @param {string} baseUrl - Auth service base URL
 * @param {string} endpoint - Endpoint path
 * @param {string} purpose - Purpose of the auth call (login, verify, etc.)
 * @param {number} statusCode - Response status code
 */
export function trackAuthEndpoint(baseUrl, endpoint, purpose, statusCode) {
    trackEndpoint('POST', baseUrl, endpoint, `Authentication: ${purpose}`, statusCode);
}

/**
 * Convenience function to track API data endpoints
 * @param {string} method - HTTP method
 * @param {string} baseUrl - API service base URL
 * @param {string} endpoint - Endpoint path
 * @param {string} resource - What resource this endpoint handles
 * @param {number} statusCode - Response status code
 */
export function trackApiEndpoint(method, baseUrl, endpoint, resource, statusCode) {
    trackEndpoint(method, baseUrl, endpoint, `API: ${resource}`, statusCode);
}

