import { 
    findNotificationById,
    checkIsReadStatus, 
    isNotificationRead, 
    isNotificationUnread,
    getReadNotifications,
    getUnreadNotifications,
    getNotificationReadStats,
    getNotificationsList
} from '../utils/getNotifications.js';

console.log('🚀 Starting is_read status checking examples...\n');

// First, let's get all notifications to work with
const allNotifications = getNotificationsList();

if (!allNotifications || allNotifications.length === 0) {
    console.log('❌ No notifications found. Exiting examples.');
    // You can still test with dummy IDs if needed
} else {
    console.log(`✅ Found ${allNotifications.length} notifications to work with\n`);
    
    // Get some notification IDs to test with
    const firstNotificationId = allNotifications[0]?.id;
    const secondNotificationId = allNotifications[1]?.id;
    
    if (firstNotificationId) {
        console.log('=== Example 1: Check detailed is_read status ===');
        const readStatus = checkIsReadStatus(firstNotificationId);
        
        if (readStatus.success) {
            console.log(`✅ Notification ${readStatus.notificationId}:`);
            console.log(`   - Found: ${readStatus.found}`);
            console.log(`   - is_read: ${readStatus.is_read}`);
            console.log(`   - Status: ${readStatus.is_read ? 'READ' : 'UNREAD'}`);
        } else {
            console.log(`❌ Failed to check status: ${readStatus.error}`);
        }
        console.log('');
        
        console.log('=== Example 2: Simple boolean checks ===');
        
        // Check if notification is read
        const isRead = isNotificationRead(firstNotificationId);
        console.log(`📖 Is notification ${firstNotificationId} read? ${isRead !== null ? isRead : 'Unknown'}`);
        
        // Check if notification is unread
        const isUnread = isNotificationUnread(firstNotificationId);
        console.log(`📧 Is notification ${firstNotificationId} unread? ${isUnread !== null ? isUnread : 'Unknown'}`);
        console.log('');
    }
    
    if (secondNotificationId) {
        console.log('=== Example 3: Find notification and check status ===');
        const notification = findNotificationById(secondNotificationId);
        
        if (notification) {
            console.log(`✅ Found notification: ${notification.id}`);
            console.log(`   - Title: ${notification.title || 'N/A'}`);
            console.log(`   - is_read: ${!!notification.is_read}`);
            console.log(`   - Created: ${notification.created_at || 'N/A'}`);
        } else {
            console.log(`❌ Notification ${secondNotificationId} not found`);
        }
        console.log('');
    }
}

console.log('=== Example 4: Get notifications by read status ===');

// Get all read notifications
const readNotifications = getReadNotifications();
if (readNotifications) {
    console.log(`📖 Found ${readNotifications.length} read notifications`);
    if (readNotifications.length > 0) {
        console.log(`   - First read notification ID: ${readNotifications[0].id}`);
    }
} else {
    console.log('❌ Failed to get read notifications');
}

// Get all unread notifications
const unreadNotifications = getUnreadNotifications();
if (unreadNotifications) {
    console.log(`📧 Found ${unreadNotifications.length} unread notifications`);
    if (unreadNotifications.length > 0) {
        console.log(`   - First unread notification ID: ${unreadNotifications[0].id}`);
    }
} else {
    console.log('❌ Failed to get unread notifications');
}
console.log('');

console.log('=== Example 5: Get read/unread statistics ===');
const stats = getNotificationReadStats();

if (stats) {
    console.log('📊 Notification Statistics:');
    console.log(`   - Total notifications: ${stats.total}`);
    console.log(`   - Read: ${stats.read} (${stats.readPercentage}%)`);
    console.log(`   - Unread: ${stats.unread} (${stats.unreadPercentage}%)`);
} else {
    console.log('❌ Failed to get notification statistics');
}
console.log('');

console.log('=== Example 6: Test with non-existent notification ID ===');
const fakeId = 'non-existent-id-12345';
const fakeResult = checkIsReadStatus(fakeId);

console.log(`🔍 Checking fake ID (${fakeId}):`);
console.log(`   - Success: ${fakeResult.success}`);
console.log(`   - Found: ${fakeResult.found}`);
console.log(`   - Error: ${fakeResult.error}`);
console.log('');

console.log('=== Example 7: Batch checking multiple notifications ===');
if (allNotifications && allNotifications.length >= 3) {
    const idsToCheck = allNotifications.slice(0, 3).map(n => n.id);
    
    console.log(`🔍 Checking ${idsToCheck.length} notifications:`);
    
    idsToCheck.forEach((id, index) => {
        const isRead = isNotificationRead(id);
        const status = isRead === null ? 'Unknown' : (isRead ? 'Read' : 'Unread');
        console.log(`   ${index + 1}. ${id}: ${status}`);
    });
}

console.log('\n✅ is_read checking examples completed!');

