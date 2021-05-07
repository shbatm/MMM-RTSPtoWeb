Module.register('MMM-HomeAssistant-WebRTC', {
    video: null,
    pc: null,
    stream: null,
    connectTimeout: null,

    defaults: {
        host: 'hassio.local',
        port: '8123',
        https: false,
        width: '50%',
        token: '',
        url: '',
    },

    start() {
        this._init();
    },

    getStyles() {
        return [this.name + '.css'];
    },

    getHeader: () => '',

    getDom() {
        if (this.stream) {
            this.video = document.createElement('video');
            this.video.classList.add('haws-video');
            this.video.autoplay = true;
            this.video.controls = false;
            this.video.volume = 1;
            this.video.muted = true;
            this.video.style.maxWidth = this.config.width;
            this.video.playsInline = true;
            this.video.srcObject = this.stream;

            const recover = () => {
                this.video.srcObject = this.stream;
                this.video.play();
            };
            this.video.onpause = recover;
            this.video.onstalled = recover;
            this.video.onerror = recover;
            return this.video;
        }

        const error = document.createElement('div');
        error.classList.add('haws-error', 'small');
        error.innerHTML = 'No data from Home Assistant';
        return error;
    },

    sendOffer(sdp) {
        this.sendSocketNotification('OFFER', {config: this.config, sdp});
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'ANSWER') {
            this._start(payload.sdp);
            this.updateDom();
        }
    },

    _startConnectTimer() {
        clearTimeout(this.connectTimeout);
        this.connectTimeout = setTimeout(() => {
            this._connect();
        }, 1000);
    },

    _stopConnectTimer() {
        clearTimeout(this.connectTimeout);
        this.connectTimeout = null;
    },

    async _init() {
        this.stream = new MediaStream();
        this.pc = new RTCPeerConnection({
            iceServers: [{
                urls: ['stun:stun.l.google.com:19302']
            }],
            iceCandidatePoolSize: 20
        });

        this.pc.onicecandidate = (e) => {
            if (!this.connectTimeout) {
                return;
            }
            this._startConnectTimer();
            if (e.candidate === null) {
                this._connect();
            }
        }

        this.pc.onconnectionstatechange = () => {
            if (this.pc.connectionState === 'failed') {
                this.pc.close();
                this.video.srcObject = null;
                this._init();
            }
        }

        this.pc.ontrack = (event) => {
            this.stream.addTrack(event.track);
        }

        const pingChannel = this.pc.createDataChannel('ping');
        let intervalId;
        pingChannel.onopen = () => {
            intervalId = setInterval(() => {
                try {
                    pingChannel.send('ping');
                } catch (e) {
                    console.warn(e);
                }
            }, 1000);
        }
        pingChannel.onclose = () => {
            clearInterval(intervalId);
        }

        this.pc.addTransceiver('video', {'direction': 'recvonly'});

        this._startConnectTimer();
        const offer = await this.pc.createOffer({offerToReceiveVideo: true});
        return this.pc.setLocalDescription(offer);
    },

    _start(sdp) {
        try {
            const remoteDesc = new RTCSessionDescription({
                type: 'answer',
                sdp,
            });
            this.pc.setRemoteDescription(remoteDesc);
        } catch (e) {
            console.warn(e);
        }
    },

    async _connect() {
        this._stopConnectTimer();
        this.sendOffer(this.pc.localDescription.sdp);
    },
});
