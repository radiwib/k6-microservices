import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { loadProfiles } from  '../../config/configVu.js';
import { handleSummary } from '../../utils/handleSummary.js';
import { getToken } from '../../utils/authDynamic.js';
import { 
    getFirstNotificationId, 
    checkIsReadStatus 
} from '../../utils/getNotifications.js';
import { 
    updateNotificationIsRead,
    toggleNotificationReadStatus,
    markNotificationAsRead,
    markNotificationAsUnread
} from '../../utils/updateNotification.js';


// Function to set up the load profile for this test
export let options = loadProfiles.quickTest;

// Log API configuration for debugging
console.log('📋 API Configuration:');
console.log(`- NOTIF_URL from ENV: ${__ENV.NOTIF_URL}`);
console.log(`- BASE_URL (CONFIG.urlNotifs): ${CONFIG.urlNotifs}`);
console.log(`- UPDATE_ENDPOINT: ${CONFIG.updateNotificationEndpoint}`);

// Token cache to store tokens per VU
const tokenCache = {};


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
    const updateResult = updateNotificationIsRead(notificationId, newIsRead, { token: token });
    
    console.log(`📊 Update result: ${updateResult.success ? 'Success' : 'Failed'}`);
    if (updateResult.response) {
        console.log(`📊 Update response status: ${updateResult.response.status}`);
    }
    
    // Step 5: Positive Flow Validation
    group('Positive Flow - Valid Update Request', function () {
        check(updateResult, {
            '(P) Update operation successful': (r) => r.success === true,
            '(P) Update response exists': (r) => r.response !== null,
            '(P) Update response status is 200': (r) => r.status === 200,
            '(P) Notification ID matches': (r) => r.notificationId === notificationId,
            '(P) Updated value matches expected': (r) => r.updatedValue === newIsRead,
        });
        
        if (updateResult.response && updateResult.response.status === 200) {
            const response = updateResult.response;
            
            check(response, {
                '(P) Response has valid content-type': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
                '(P) Response body exists': (r) => r.body && r.body.length > 0,
            });
            
            try {
                const responseData = response.json();
                
                check(responseData, {
                    '(P) Response has valid structure': (data) => data !== null && typeof data === 'object',
                    '(P) Response indicates success': (data) => {
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
        const invalidResult = updateNotificationIsRead(invalidId, true, { token: token });
        
        check(invalidResult, {
            '(N) Invalid ID operation fails': (r) => r.success === false,
            '(N) Invalid ID returns 404 or 400': (r) => [400, 404].includes(r.status),
            '(N) Invalid ID response is not 200': (r) => r.status !== 200,
        });
        
        // Test with invalid token
        const invalidTokenResult = updateNotificationIsRead(notificationId, true, { token: 'invalid-token-123' });
        
        check(invalidTokenResult, {
            '(N) Invalid token operation fails': (r) => r.success === false,
            '(N) Invalid token returns 401': (r) => r.status === 401,
            '(N) Invalid token response is not 200': (r) => r.status !== 200,
        });
        
        // Test with missing token (let utility handle auth)
        const noTokenResult = updateNotificationIsRead(notificationId, true, { token: '' });
        
        check(noTokenResult, {
            '(N) Missing token operation fails': (r) => r.success === false,
            '(N) Missing token returns 401 or auth error': (r) => r.status === 401 || r.error === 'Authentication failed - no token obtained',
        });
        
        // Test with invalid boolean value
        const invalidBooleanResult = updateNotificationIsRead(notificationId, 'not-a-boolean', { token: token });
        
        check(invalidBooleanResult, {
            '(N) Invalid boolean operation fails': (r) => r.success === false,
            '(N) Invalid boolean has error message': (r) => r.error === 'is_read value must be a boolean',
        });
        
        // Test with empty notification ID
        const emptyIdResult = updateNotificationIsRead('', true, { token: token });
        
        check(emptyIdResult, {
            '(N) Empty ID operation fails': (r) => r.success === false,
            '(N) Empty ID has error message': (r) => r.error === 'Notification ID is required',
        });
    });
    
    // Step 8: Test Additional Utility Functions
    group('Additional Utility Functions', function () {
        // Test markNotificationAsRead
        const markAsReadResult = markNotificationAsRead(notificationId, { token: token });
        
        check(markAsReadResult, {
            '(P) Mark as read operation structure': (r) => r.hasOwnProperty('success'),
            '(P) Mark as read sets correct value': (r) => r.updatedValue === true,
        });
        
        // Wait a moment
        sleep(0.5);
        
        // Test markNotificationAsUnread
        const markAsUnreadResult = markNotificationAsUnread(notificationId, { token: token });
        
        check(markAsUnreadResult, {
            '(P) Mark as unread operation structure': (r) => r.hasOwnProperty('success'),
            '(P) Mark as unread sets correct value': (r) => r.updatedValue === false,
        });
        
        // Wait a moment
        sleep(0.5);
        
        // Test toggleNotificationReadStatus
        const currentStatusForToggle = checkIsReadStatus(notificationId, { token: token });
        if (currentStatusForToggle.success) {
            const toggleResult = toggleNotificationReadStatus(notificationId, currentStatusForToggle.is_read, { token: token });
            
            check(toggleResult, {
                '(P) Toggle operation structure': (r) => r.hasOwnProperty('success'),
                '(P) Toggle sets opposite value': (r) => r.updatedValue === !currentStatusForToggle.is_read,
            });
        }
    });
    
    console.log(`✅ VU ${__VU}: Update notification test completed`);
    
    // Add sleep to avoid overwhelming the API
    sleep(0.5);
}

// Execute handleSummary function for test summary
export { handleSummary };

