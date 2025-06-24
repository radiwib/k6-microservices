import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { loadProfiles } from  '../../config/configVu.js';
import { handleSummary } from '../../utils/handleSummary.js';
import { getToken } from '../../utils/authDynamic.js';
import { 
    getNotifications, 
    getNotificationsList, 
    getFirstNotificationId, 
    checkIsReadStatus 
} from '../../utils/getNotifications.js';


// Function to set up the load profile for this test
export let options = loadProfiles.quickTest;

// Log API configuration for debugging
console.log('📋 API Configuration:');
console.log(`- NOTIF_URL from ENV: ${__ENV.NOTIF_URL}`);
console.log(`- BASE_URL (CONFIG.urlNotifs): ${CONFIG.urlNotifs}`);
console.log(`- UPDATE_ENDPOINT: ${CONFIG.updateNotificationEndpoint}`);

// Token cache to store tokens per VU
const tokenCache = {};

/**
 * Update notification is_read status
 * @param {string} notificationId - Notification ID to update
 * @param {string} token - Authentication token
 * @param {boolean} newIsReadValue - New is_read value to set
 * @returns {Object} - HTTP response object
 */
function updateNotificationIsRead(notificationId, token, newIsReadValue) {
    const baseUrl = CONFIG.urlNotifs;
    const endpoint = CONFIG.updateNotificationEndpoint;
    
    // Construct URL
    let url;
    if (baseUrl.endsWith('/') && endpoint.startsWith('/')) {
        url = `${baseUrl}${endpoint.substring(1)}/${notificationId}`;
    } else if (!baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
        url = `${baseUrl}/${endpoint}/${notificationId}`;
    } else {
        url = `${baseUrl}${endpoint}/${notificationId}`;
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    
    const payload = {
        is_read: newIsReadValue
    };
    
    console.log(`🔄 Updating notification ${notificationId} is_read to: ${newIsReadValue}`);
    console.log(`🔗 PATCH URL: ${url}`);
    
    return http.patch(url, JSON.stringify(payload), { headers });
}

export default function () {
    console.log(`📝 VU ${__VU}: Starting update notification test...`);
    
    // Step 1: Get authentication token first
    let token = tokenCache[__VU];
    
    if (!token) {
        console.log(`🔄 VU ${__VU}: Getting authentication token...`);
        
        // Import and use getToken from authDynamic
        
        token = getToken();
        
        if (!token) {
            console.error('❌ Failed to obtain authentication token');
            console.error('Check your authentication configuration:');
            console.error(`- USER_URL: ${CONFIG.urlUsers}`);
            console.error(`- PHONE: ${CONFIG.phone}`);
            console.error(`- TYPE: ${CONFIG.type}`);
            console.error(`- CODE: ${CONFIG.code}`);
            
            check(false, {
                '(N) Authentication failed - no token obtained': () => false,
            });
            return;
        }
        
        console.log(`✅ Authentication token acquired for VU ${__VU}`);
        tokenCache[__VU] = token;
    }
    
    // Step 2: Get first notification ID using utility
    const notificationId = getFirstNotificationId({ token: token });
    
    if (!notificationId) {
        console.error('❌ No notification ID available for testing');
        
        check(false, {
            '(N) No notifications available for update test': () => false,
        });
        return;
    }
    
    console.log(`🎯 Testing with notification ID: ${notificationId}`);
    
    // Step 3: Check current is_read status
    const currentStatus = checkIsReadStatus(notificationId, { token: token });
    
    if (!currentStatus.success) {
        console.error(`❌ Failed to get current is_read status: ${currentStatus.error}`);
        
        check(false, {
            '(N) Failed to retrieve current notification status': () => false,
        });
        return;
    }
    
    const currentIsRead = currentStatus.is_read;
    const newIsRead = !currentIsRead; // Toggle the value
    
    console.log(`📊 Current is_read: ${currentIsRead}, will set to: ${newIsRead}`);
    
    // Step 4: Update the notification (toggle is_read status)
    const updateResponse = updateNotificationIsRead(notificationId, token, newIsRead);
    
    console.log(`📊 Update response status: ${updateResponse.status}`);
    
    // Step 5: Positive Flow Validation
    group('Positive Flow - Valid Update Request', function () {
        check(updateResponse, {
            '(P) Update response status is 200': (r) => r.status === 200,
            '(P) Update response has valid content-type': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
            '(P) Update response body exists': (r) => r.body && r.body.length > 0,
        });
        
        if (updateResponse.status === 200) {
            try {
                const responseData = updateResponse.json();
                
                check(responseData, {
                    '(P) Update response has valid structure': (data) => data !== null && typeof data === 'object',
                    '(P) Update response indicates success': (data) => {
                        // Check common success indicators
                        return data.success === true || 
                               data.status === 'success' || 
                               data.message || 
                               data.data;
                    },
                });
            } catch (e) {
                console.error(`❌ Failed to parse update response JSON: ${e.message}`);
                
                check(false, {
                    '(N) Update response JSON parsing failed': () => false,
                });
            }
        }
    });
    
    // Step 6: Verify the update was applied
    group('Update Verification', function () {
        console.log('🔍 Verifying the update was applied...');
        
        // Wait a moment for the update to propagate
        sleep(1);
        
        // Check the status again
        const verificationStatus = checkIsReadStatus(notificationId, { token: token });
        
        if (verificationStatus.success) {
            const updatedIsRead = verificationStatus.is_read;
            
            check(verificationStatus, {
                '(P) Verification check successful': (vs) => vs.success === true,
                '(P) is_read value was updated correctly': (vs) => vs.is_read === newIsRead,
                '(P) is_read value changed from original': (vs) => vs.is_read !== currentIsRead,
            });
            
            console.log(`✅ Verification: is_read changed from ${currentIsRead} to ${updatedIsRead}`);
        } else {
            console.error(`❌ Verification failed: ${verificationStatus.error}`);
            
            check(false, {
                '(N) Update verification failed': () => false,
            });
        }
    });
    
    // Step 7: Negative Flow Testing
    group('Negative Flow - Invalid Requests', function () {
        // Test with invalid notification ID
        const invalidId = 'invalid-notification-id-12345';
        const invalidResponse = updateNotificationIsRead(invalidId, token, true);
        
        check(invalidResponse, {
            '(N) Invalid ID returns 404 or 400': (r) => [400, 404].includes(r.status),
            '(N) Invalid ID response is not 200': (r) => r.status !== 200,
        });
        
        // Test with invalid token
        const invalidTokenResponse = updateNotificationIsRead(notificationId, 'invalid-token-123', true);
        
        check(invalidTokenResponse, {
            '(N) Invalid token returns 401': (r) => r.status === 401,
            '(N) Invalid token response is not 200': (r) => r.status !== 200,
        });
        
        // Test with missing token
        const noTokenResponse = updateNotificationIsRead(notificationId, '', true);
        
        check(noTokenResponse, {
            '(N) Missing token returns 401': (r) => r.status === 401,
        });
        
        // Test with empty body
        const baseUrl = CONFIG.urlNotifs;
        const endpoint = CONFIG.updateNotificationEndpoint;
        const emptyBodyUrl = `${baseUrl}${endpoint}/${notificationId}`;
        const emptyBodyResponse = http.patch(emptyBodyUrl, '', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        check(emptyBodyResponse, {
            '(N) Empty body returns appropriate status': (r) => [400, 422, 200].includes(r.status), // Some APIs might accept empty body
        });
    });
    
    console.log(`✅ VU ${__VU}: Update notification test completed`);
    
    // Add sleep to avoid overwhelming the API
    sleep(0.5);
}

// Execute handleSummary function for test summary
export { handleSummary };

