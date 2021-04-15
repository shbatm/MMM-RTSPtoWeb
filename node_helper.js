const NodeHelper = require('node_helper');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports = NodeHelper.create({
    start: function() {
        console.log('Starting node_helper for module [' + this.name + ']');
    },

    sendOffer: function(data) {
        const url = this.buildUrl(data.config);
        const headers = {};

        if (data.config.token) {
            headers['Authorization'] = 'Bearer ' + data.config.token;
        }

        const params = new URLSearchParams();
        params.append('url', data.config.url);
        params.append('sdp64', data.sdp64);

        fetch(url, {method: 'POST', body: params, headers})
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => this.sendSocketNotification('ANSWER', data));
                } else {
                    throw new Error('Response is not ok');
                }
            })
            .catch((error) => {
                console.error(this.name + ' ERROR:', error);
            });
    },

    buildUrl: function(config) {
        let url = config.host;
        if (config.port) {
            url += ':' + config.port;
        }
        url += '/api/webrtc/stream';
        if (config.https) {
            url = 'https://' + url;
        } else {
            url = 'http://' + url;
        }
        return url;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'OFFER') {
            this.sendOffer(payload);
        }
    }
});