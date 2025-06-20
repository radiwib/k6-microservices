import http from 'k6/http';
import { CONFIG } from '../config/configEnv.js';
import { assertStatus } from './checkers.js';

export function getNotificationId() {
    console.log('🔍 Retrieving notification ID for test...');

    // Make the request to get the notification ID
    const res = http.get(`${CONFIG.urlNotifications}${CONFIG.listNotificationsEndpoint}`, { headers });

    // Check the response status
    assertStatus(res, 200);
    if (res.status !== 200) {
        console.error(`❌ Failed to retrieve notification ID. Status: ${res.status}`);
        console.error(`Response body: ${res.body}`);
        return null;
    }

    // Parse and return the notification ID from the response
    const notificationData = res.json();
    if (!notificationData || !notificationData.data || !notificationData.data[0] || !notificationData.data[0].id) {
        console.error('❌ Notification ID not found in response');
        return null;
    }
    // Log the retrieved notification ID
    console.log(`✅ Notification ID retrieved: ${notificationData.data[0].id}`);

    // Dynamically get the first notification's id and is_read status
    const notification = notificationData.data[0];
    const notificationId = notification.id;
    const isRead = !!notification.is_read;
    return { notificationId, isRead };
}