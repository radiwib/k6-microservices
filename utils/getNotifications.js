import http from 'k6/http';
import { CONFIG } from '../config/configEnv.js';
import { getToken } from './authDynamic.js';

/**
 * Fetches the list of notifications from the API with automatic authentication
 * @param {Object} options - Optional parameters
 * @param {string} options.baseUrl - Override base URL (defaults to CONFIG.urlNotifs)
 * @param {string} options.endpoint - Override endpoint (defaults to CONFIG.listNotificationsEndpoint)
 * @param {string} options.token - Use existing token instead of getting a new one
 * @returns {Object|null} - Response object with notifications data or null if failed
 */
export function getNotifications(options = {}) {
    console.log('🔍 Retrieving notifications list...');

    // Use provided options or fall back to config defaults
    const baseUrl = options.baseUrl || CONFIG.urlNotifs;
    const endpoint = options.endpoint || CONFIG.listNotificationsEndpoint;
    
    // Get authentication token
    let token = options.token;
    if (!token) {
        console.log('🔐 Getting authentication token...');
        token = getToken();
        
        if (!token) {
            console.error('❌ Failed to obtain authentication token');
            console.error('Check your authentication configuration:');
            console.error(`- USER_URL: ${CONFIG.urlUsers}`);
            console.error(`- PHONE: ${CONFIG.phone}`);
            console.error(`- TYPE: ${CONFIG.type}`);
            console.error(`- CODE: ${CONFIG.code}`);
            return {
                success: false,
                data: null,
                response: null,
                status: null,
                error: 'Authentication failed - no token obtained'
            };
        }
        console.log('✅ Authentication token acquired successfully');
    }

    if (!baseUrl || !endpoint) {
        console.error('❌ Missing required configuration for notifications API');
        console.error(`- Base URL: ${baseUrl}`);
        console.error(`- Endpoint: ${endpoint}`);
        return {
            success: false,
            data: null,
            response: null,
            status: null,
            error: 'Missing API configuration'
        };
    }

    // Construct the full URL with proper joining
    let url;
    if (baseUrl && endpoint) {
        if (baseUrl.endsWith('/') && endpoint.startsWith('/')) {
            url = `${baseUrl}${endpoint.substring(1)}`;
        } else if (!baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
            url = `${baseUrl}/${endpoint}`;
        } else {
            url = `${baseUrl}${endpoint}`;
        }
    } else {
        console.error('❌ Unable to construct API URL');
        return {
            success: false,
            data: null,
            response: null,
            status: null,
            error: 'Unable to construct API URL'
        };
    }

    // Prepare request headers
    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };

    console.log(`🔗 Requesting notifications from: ${url}`);

    try {
        // Make the API request
        const response = http.get(url, params);
        
        console.log(`📊 Response status: ${response.status}`);

        // Check if request was successful
        if (response.status === 200) {
            const responseData = response.json();
            
            if (responseData && responseData.data) {
                console.log(`✅ Retrieved ${responseData.data.length} notifications`);
                return {
                    success: true,
                    data: responseData.data,
                    response: response,
                    status: response.status,
                    meta: responseData.meta || null
                };
            } else {
                console.error('❌ No data found in response');
                return {
                    success: false,
                    data: null,
                    response: response,
                    status: response.status,
                    error: 'No data in response'
                };
            }
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
                data: null,
                response: response,
                status: response.status,
                error: errorData.message || 'Unauthorized access'
            };
        } else {
            console.error(`❌ Failed to retrieve notifications. Status: ${response.status}`);
            
            // Try to parse error response
            let errorMessage = 'Unknown error';
            try {
                const errorData = response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = response.body || errorMessage;
            }

            return {
                success: false,
                data: null,
                response: response,
                status: response.status,
                error: errorMessage
            };
        }
    } catch (error) {
        console.error(`❌ Exception during notifications request: ${error.message}`);
        return {
            success: false,
            data: null,
            response: null,
            status: null,
            error: error.message
        };
    }
}

/**
 * Simplified function to get just the notifications data array
 * @param {Object} options - Optional parameters
 * @returns {Array|null} - Array of notifications or null if failed
 */
export function getNotificationsList(options = {}) {
    const result = getNotifications(options);
    return result && result.success ? result.data : null;
}

/**
 * Get notifications with additional filtering/pagination options
 * @param {Object} filters - Filter options
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @param {string} filters.type - Notification type filter
 * @param {boolean} filters.is_read - Filter by read status
 * @returns {Object|null} - Response object or null if failed
 */
export function getNotificationsWithFilters(filters = {}) {
    const baseUrl = CONFIG.urlNotifs;
    let endpoint = CONFIG.listNotificationsEndpoint;
    
    // Add query parameters if filters are provided
    const queryParams = [];
    if (filters.page) queryParams.push(`page=${filters.page}`);
    if (filters.limit) queryParams.push(`limit=${filters.limit}`);
    if (filters.type) queryParams.push(`type=${filters.type}`);
    if (filters.is_read !== undefined) queryParams.push(`is_read=${filters.is_read}`);
    
    if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
    }
    
    console.log(`🔍 Getting notifications with filters: ${JSON.stringify(filters)}`);
    return getNotifications({ baseUrl, endpoint });
}

/**
 * Get a specific notification by ID
 * @param {string} notificationId - The notification ID to retrieve
 * @param {Object} options - Optional parameters
 * @returns {Object|null} - Response object or null if failed
 */
export function getNotificationById(notificationId, options = {}) {
    if (!notificationId) {
        console.error('❌ Notification ID is required');
        return {
            success: false,
            data: null,
            response: null,
            status: null,
            error: 'Notification ID is required'
        };
    }

    const baseUrl = options.baseUrl || CONFIG.urlNotifs;
    const endpoint = `${CONFIG.listNotificationsEndpoint}/${notificationId}`;
    
    console.log(`🔍 Getting notification by ID: ${notificationId}`);
    return getNotifications({ baseUrl, endpoint, token: options.token });
}

/**
 * Find a notification by ID from the notifications list
 * @param {string} notificationId - The notification ID to find
 * @param {Object} options - Optional parameters
 * @returns {Object|null} - Notification object or null if not found
 */
export function findNotificationById(notificationId, options = {}) {
    if (!notificationId) {
        console.error('❌ Notification ID is required');
        return null;
    }

    console.log(`🔍 Searching for notification ID: ${notificationId}`);
    
    const notificationsList = getNotificationsList(options);
    
    if (!notificationsList || !Array.isArray(notificationsList)) {
        console.error('❌ Failed to retrieve notifications list');
        return null;
    }

    const notification = notificationsList.find(item => item.id === notificationId);
    
    if (notification) {
        console.log(`✅ Found notification with ID: ${notificationId}`);
        return notification;
    } else {
        console.log(`❌ Notification with ID ${notificationId} not found in list`);
        return null;
    }
}

/**
 * Check the is_read status of a specific notification by ID
 * @param {string} notificationId - The notification ID to check
 * @param {Object} options - Optional parameters
 * @returns {Object} - Result object with is_read status and additional info
 */
export function checkIsReadStatus(notificationId, options = {}) {
    if (!notificationId) {
        console.error('❌ Notification ID is required');
        return {
            success: false,
            notificationId: null,
            is_read: null,
            found: false,
            error: 'Notification ID is required'
        };
    }

    console.log(`📖 Checking is_read status for notification ID: ${notificationId}`);
    
    const notification = findNotificationById(notificationId, options);
    
    if (!notification) {
        return {
            success: false,
            notificationId: notificationId,
            is_read: null,
            found: false,
            error: `Notification with ID ${notificationId} not found`
        };
    }

    const isRead = !!notification.is_read; // Ensure boolean value
    
    console.log(`📊 Notification ${notificationId} is_read status: ${isRead}`);
    
    return {
        success: true,
        notificationId: notificationId,
        is_read: isRead,
        found: true,
        notification: notification,
        error: null
    };
}

/**
 * Check if a notification is read (is_read = true)
 * @param {string} notificationId - The notification ID to check
 * @param {Object} options - Optional parameters
 * @returns {boolean|null} - True if read, false if unread, null if not found or error
 */
export function isNotificationRead(notificationId, options = {}) {
    const result = checkIsReadStatus(notificationId, options);
    return result.success ? result.is_read : null;
}

/**
 * Check if a notification is unread (is_read = false)
 * @param {string} notificationId - The notification ID to check
 * @param {Object} options - Optional parameters
 * @returns {boolean|null} - True if unread, false if read, null if not found or error
 */
export function isNotificationUnread(notificationId, options = {}) {
    const result = checkIsReadStatus(notificationId, options);
    return result.success ? !result.is_read : null;
}

/**
 * Get all read notifications from the list
 * @param {Object} options - Optional parameters
 * @returns {Array|null} - Array of read notifications or null if failed
 */
export function getReadNotifications(options = {}) {
    console.log('📖 Getting all read notifications...');
    
    const notificationsList = getNotificationsList(options);
    
    if (!notificationsList || !Array.isArray(notificationsList)) {
        console.error('❌ Failed to retrieve notifications list');
        return null;
    }

    const readNotifications = notificationsList.filter(notification => !!notification.is_read);
    
    console.log(`✅ Found ${readNotifications.length} read notifications out of ${notificationsList.length} total`);
    
    return readNotifications;
}

/**
 * Get all unread notifications from the list
 * @param {Object} options - Optional parameters
 * @returns {Array|null} - Array of unread notifications or null if failed
 */
export function getUnreadNotifications(options = {}) {
    console.log('📖 Getting all unread notifications...');
    
    const notificationsList = getNotificationsList(options);
    
    if (!notificationsList || !Array.isArray(notificationsList)) {
        console.error('❌ Failed to retrieve notifications list');
        return null;
    }

    const unreadNotifications = notificationsList.filter(notification => !notification.is_read);
    
    console.log(`✅ Found ${unreadNotifications.length} unread notifications out of ${notificationsList.length} total`);
    
    return unreadNotifications;
}

/**
 * Get statistics about read/unread notifications
 * @param {Object} options - Optional parameters
 * @returns {Object|null} - Statistics object or null if failed
 */
export function getNotificationReadStats(options = {}) {
    console.log('📊 Getting notification read statistics...');
    
    const notificationsList = getNotificationsList(options);
    
    if (!notificationsList || !Array.isArray(notificationsList)) {
        console.error('❌ Failed to retrieve notifications list');
        return null;
    }

    const total = notificationsList.length;
    const read = notificationsList.filter(n => !!n.is_read).length;
    const unread = total - read;
    const readPercentage = total > 0 ? ((read / total) * 100).toFixed(2) : 0;
    const unreadPercentage = total > 0 ? ((unread / total) * 100).toFixed(2) : 0;

    const stats = {
        total: total,
        read: read,
        unread: unread,
        readPercentage: parseFloat(readPercentage),
        unreadPercentage: parseFloat(unreadPercentage)
    };

    console.log(`📊 Notification Statistics:`);
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - Read: ${stats.read} (${stats.readPercentage}%)`);
    console.log(`   - Unread: ${stats.unread} (${stats.unreadPercentage}%)`);

    return stats;
}

