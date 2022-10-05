const NodeHelper = require('node_helper');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports = NodeHelper.create({
    start: function() {
        console.log('Starting node_helper for module [' + this.name + ']');
    },

    sendOffer: function(payload) {
        fetch(payload.url, {
            method: 'POST',
            body: new URLSearchParams({ data: payload.sdp })
          })
            .then(response => response.text())
            .then(response_data => this.sendSocketNotification(`ANSWER_${payload.identifier}`, response_data));
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'OFFER') {
            this.sendOffer(payload);
        }
    }
});