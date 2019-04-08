import config from '../../config/config';

const Client = require('node-rest-client').Client;

const client = new Client();

function sendPushNotifications(data) {
    if (!config.pushNotificationsEnabled) return;
    const authArgs = {
        headers: { 'Content-Type': 'application/json' },
        data: {
            username: config.microserviceAccessKey,
            password: config.microservicePassword,
        },
    };
    // eslint-disable-next-line no-unused-vars
    client.post(`${config.authMicroService}/auth/login`, authArgs, (authResData, response) => {
        const { token } = authResData;
        const pushNotificationArgs = {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: { data,  protocol: 'push'},
        };
        // eslint-disable-next-line no-unused-vars
        client.post(`${config.notificationMicroservice}/notifications/send`, pushNotificationArgs, (notificationResData, notificationResponse) => {
        });
    });
}

export default {
    sendPushNotifications,
};
