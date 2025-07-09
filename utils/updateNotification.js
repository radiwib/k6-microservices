import http from 'k6/http';
import { CONFIG } from '../config/configEnv.js';
import { getToken } from './authDynamic.js';
import { trackApiEndpoint } from './endpointTracker.js';

/**
 * Update notification is_read status
 * @param {string} notificationId - Notification ID to update
 * @param {boolean} newIsReadValue - New is_read value to set
 * @param {Object} options - Optional parameters
 * @param {string} options.token - Use existing token instead of getting a new one
 * @param {string} options.baseUrl - Override base URL (defaults to CONFIG.urlNotifs)
 * @param {string} options.endpoint - Override endpoint (defaults to CONFIG.updateNotificationEndpoint)
 * @returns {Object} - Response object with success status and additional info
 */
export function updateNotificationIsRead(notificationId, newIsReadValue, options = {}) {
    if (!notificationId) {
        console.error('❌ Notification ID is required');
        return {
            success: false,
            response: null,
            status: null,
            error: 'Notification ID is required'
        };
    }

    if (typeof newIsReadValue !== 'boolean') {
        console.error('❌ is_read value must be a boolean');
        return {
            success: false,
            response: null,
            status: null,
            error: 'is_read value must be a boolean'
        };
    }

    console.log(`🔄 Updating notification ${notificationId} is_read to: ${newIsReadValue}`);

    // Get authentication token
    let token = options.token;
    if (!token) {
        console.log('🔐 Getting authentication token...');
        token = getToken();
        
        if (!token) {
            console.error('❌ Failed to obtain authentication token');
            return {
                success: false,
                response: null,
                status: null,
                error: 'Authentication failed - no token obtained'
            };
        }
        console.log('✅ Authentication token acquired successfully');
    }

    // Use provided options or fall back to config defaults
    const baseUrl = options.baseUrl || CONFIG.urlNotifs;
    const endpoint = options.endpoint || CONFIG.updateNotificationEndpoint;

    if (!baseUrl || !endpoint) {
        console.error('❌ Missing required configuration for update API');
        console.error(`- Base URL: ${baseUrl}`);
        console.error(`- Endpoint: ${endpoint}`);
        return {
            success: false,
            response: null,
            status: null,
            error: 'Missing API configuration'
        };
    }

    // Construct URL with proper joining
    let url;
    if (baseUrl.endsWith('/') && endpoint.startsWith('/')) {
        url = `${baseUrl}${endpoint.substring(1)}/${notificationId}`;
    } else if (!baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
        url = `${baseUrl}/${endpoint}/${notificationId}`;
    } else {
        url = `${baseUrl}${endpoint}/${notificationId}`;
    }

    // Prepare request headers
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    // Prepare request payload
    const payload = {
        is_read: newIsReadValue
    };

    console.log(`🔗 PATCH URL: ${url}`);
    console.log(`📦 Payload: ${JSON.stringify(payload)}`);

    try {
        // Make the PATCH request
        const response = http.patch(url, JSON.stringify(payload), { headers });
        
        // Track the endpoint
        trackApiEndpoint('PATCH', baseUrl, `${endpoint}/${notificationId}`, 'Update Notification', response.status);
        
        console.log(`📊 Update response status: ${response.status}`);

        // Check if request was successful
        if (response.status === 200) {
            console.log('✅ Notification updated successfully');
            
            return {
                success: true,
                response: response,
                status: response.status,
                notificationId: notificationId,
                updatedValue: newIsReadValue,
                error: null
            };
        } else if (response.status === 401) {
            console.error('❌ Unauthorized - token may be expired or invalid');
            
            let errorData;
            try {
                errorData = response.json();
            } catch (e) {
                errorData = { message: 'Unauthorized access' };
            }

            return {
                success: false,
                response: response,
                status: response.status,
                notificationId: notificationId,
                updatedValue: newIsReadValue,
                error: errorData.message || 'Unauthorized access'
            };
        } else if ([400, 404].includes(response.status)) {
            console.error(`❌ Client error: ${response.status}`);
            
            let errorMessage = 'Client error';
            try {
                const errorData = response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = response.body || errorMessage;
            }

            return {
                success: false,
                response: response,
                status: response.status,
                notificationId: notificationId,
                updatedValue: newIsReadValue,
                error: errorMessage
            };
        } else {
            console.error(`❌ Failed to update notification. Status: ${response.status}`);
            
            let errorMessage = 'Unknown error';
            try {
                const errorData = response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = response.body || errorMessage;
            }

            return {
                success: false,
                response: response,
                status: response.status,
                notificationId: notificationId,
                updatedValue: newIsReadValue,
                error: errorMessage
            };
        }
    } catch (error) {
        console.error(`❌ Exception during notification update: ${error.message}`);
        return {
            success: false,
            response: null,
            status: null,
            notificationId: notificationId,
            updatedValue: newIsReadValue,
            error: error.message
        };
    }
}

/**
 * Update notification to mark as read (is_read = true)
 * @param {string} notificationId - Notification ID to update
 * @param {Object} options - Optional parameters
 * @returns {Object} - Response object
 */
export function markNotificationAsRead(notificationId, options = {}) {
    console.log(`📖 Marking notification ${notificationId} as read`);
    return updateNotificationIsRead(notificationId, true, options);
}

/**
 * Update notification to mark as unread (is_read = false)
 * @param {string} notificationId - Notification ID to update
 * @param {Object} options - Optional parameters
 * @returns {Object} - Response object
 */
export function markNotificationAsUnread(notificationId, options = {}) {
    console.log(`📧 Marking notification ${notificationId} as unread`);
    return updateNotificationIsRead(notificationId, false, options);
}

/**
 * Toggle notification is_read status (read ↔ unread)
 * @param {string} notificationId - Notification ID to update
 * @param {boolean} currentIsReadValue - Current is_read value
 * @param {Object} options - Optional parameters
 * @returns {Object} - Response object
 */
export function toggleNotificationReadStatus(notificationId, currentIsReadValue, options = {}) {
    const newValue = !currentIsReadValue;
    console.log(`🔄 Toggling notification ${notificationId} from ${currentIsReadValue} to ${newValue}`);
    return updateNotificationIsRead(notificationId, newValue, options);
}

/**
 * Batch update multiple notifications is_read status
 * @param {Array} notificationIds - Array of notification IDs to update
 * @param {boolean} newIsReadValue - New is_read value to set for all
 * @param {Object} options - Optional parameters
 * @returns {Array} - Array of response objects
 */
export function batchUpdateNotificationsIsRead(notificationIds, newIsReadValue, options = {}) {
    if (!Array.isArray(notificationIds)) {
        console.error('❌ notificationIds must be an array');
        return [];
    }

    console.log(`🔄 Batch updating ${notificationIds.length} notifications is_read to: ${newIsReadValue}`);
    
    const results = [];
    
    for (const notificationId of notificationIds) {
        const result = updateNotificationIsRead(notificationId, newIsReadValue, options);
        results.push(result);
        
        // Add small delay between requests to avoid overwhelming the API
        if (options.batchDelay) {
            // Note: sleep would need to be imported from k6 if used
            // sleep(options.batchDelay);
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`📊 Batch update results: ${successCount} successful, ${failureCount} failed`);
    
    return results;
}

