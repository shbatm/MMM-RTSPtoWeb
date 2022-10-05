Module.register("MMM-RTSPtoWeb", {
    video: null,
    pc: null,
    stream: null,
    connectTimeout: null,

    suspended: false,
    suspendedForUserPresence: false,

    defaults: {
        width: "50%",
        token: "",
        url: "",
    },

    start: function () {
        this._init();
    },

    suspend: function () {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.suspended = true;
    },

    resume: function () {
        this._init();
        this.suspended = false;
    },

    getStyles: function () {
        return [this.name + ".css"];
    },

    getDom: function () {
        if (this.stream) {
            this.video = document.createElement("video");
            this.video.classList.add("rtw-video");
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
            this.video.onstalled = recover;
            this.video.onerror = recover;
            return this.video;
        }

        const error = document.createElement("div");
        error.classList.add("rtw-error", "small");
        error.innerHTML = "No data from RTSPtoWeb";
        return error;
    },

    notificationReceived: function(notification, payload, sender) {
        // Handle USER_PRESENCE events from the MMM-PIR-sensor/similar modules
        if (notification === "USER_PRESENCE") {
            if (payload) {
                this.suspendedForUserPresence = false;
                if (this.suspended && this.visible) {
                    this.resume();
                }
                return;
            } else {
                this.suspendedForUserPresence = true;
                this.suspend();
            }
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === `ANSWER_${this.identifier}`) {
            console.log(payload);
            try {
                this.pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: atob(payload) })
                )
            } catch (e) {
                console.warn(e)
            }
            return;
        }
    },

    async _init() {
        this.stream = new MediaStream();
        this.pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: ["stun:stun.l.google.com:19302"],
                },
            ],
            sdpSemantics: 'unified-plan'
        });

        this.pc.onconnectionstatechange = () => {
            if (this.pc.connectionState === "failed") {
                this.pc.close();
                this.video.srcObject = null;
                this._init();
            }
        };

        this.pc.ontrack = (event) => {
            this.stream.addTrack(event.track);
        };

        const pingChannel = this.pc.createDataChannel("ping");
        let intervalId;
        pingChannel.onopen = () => {
            intervalId = setInterval(() => {
                try {
                    pingChannel.send("ping");
                } catch (e) {
                    console.warn(e);
                }
            }, 1000);
        };
        pingChannel.onclose = () => {
            clearInterval(intervalId);
            this._init()
        };

        this.pc.addTransceiver("video", { direction: "recvonly" });
        this.pc.onnegotiationneeded = async () => {
            const offer = await this.pc.createOffer()

            await this.pc.setLocalDescription(offer)

            this.sendSocketNotification("OFFER", { url: this.config.url, sdp: btoa(this.pc.localDescription.sdp), identifier: this.identifier })
          }
    },
});
