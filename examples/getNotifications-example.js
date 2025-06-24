import { getNotifications, getNotificationsList, getNotificationsWithFilters, getFirstNotificationId, getFirstNotification } from '../utils/getNotifications.js';

// Example 1: Basic usage - Get all notifications
console.log('=== Example 1: Basic Usage ===');
const result = getNotifications();

if (result && result.success) {
    console.log(`✅ Successfully retrieved ${result.data.length} notifications`);
    console.log('First notification:', result.data[0]);
} else {
    console.log('❌ Failed to get notifications:', result ? result.error : 'Unknown error');
}

// Example 2: Get just the data array
console.log('\n=== Example 2: Get Data Array Only ===');
const notifications = getNotificationsList();

if (notifications) {
    console.log(`✅ Retrieved ${notifications.length} notifications as array`);
} else {
    console.log('❌ Failed to get notifications array');
}

// Example 3: Get notifications with filters
console.log('\n=== Example 3: With Filters ===');
const filteredResult = getNotificationsWithFilters({
    page: 1,
    limit: 10,
    is_read: false
});

if (filteredResult && filteredResult.success) {
    console.log(`✅ Retrieved ${filteredResult.data.length} unread notifications`);
} else {
    console.log('❌ Failed to get filtered notifications');
}

// Example 4: Using existing token
console.log('\n=== Example 4: Using Existing Token ===');
// First get a token (in real usage, you might cache this)
import { getToken } from '../utils/authDynamic.js';
const token = getToken();

if (token) {
    const resultWithToken = getNotifications({ token: token });
    if (resultWithToken && resultWithToken.success) {
        console.log(`✅ Used existing token to get ${resultWithToken.data.length} notifications`);
    }
}

