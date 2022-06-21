# MMM-RTSPtoWeb

MagicMirror2 Module for viewing IP cameras RTSP stream in real time using WebRTC technology.

Requires a [RTSPtoWeb](https://github.com/deepch/RTSPtoWeb) or [RTSPtoWebRTC](https://github.com/deepch/RTSPtoWebRTC) server running in the background. If you use Home Assistant, this can be the the RTSPtoWeb Add-On (e.g. http://homeassistant.local:8083).

### Configuration

| Option | Default value | Description |
| ------ | ------------- | ----------- |
| width | 50% | Max video width |
| url | | [WebRTC stream URL](https://github.com/deepch/RTSPtoWeb/blob/master/docs/api.md#webrtc) from the RTSPtoWeb* server |

To get the list of the streams available: `curl http://demo:demo@127.0.0.1:8083/streams`

Example Config:

```js
    {
      module: "MMM-RTSPtoWeb",
      position: "top_center",
      header: "Front Door",
      config: {
        width: "100%",
        url: "http://homeassistant.local:8083/stream/camera.front_door/channel/0/webrtc"
      }
    },
```

---

Based on the work done by [@Anonym-tsk](https://github.com/Anonym-tsk/) for [MMM-HomeAssistant-WebRTC](https://github.com/Anonym-tsk/MMM-HomeAssistant-WebRTC) and [@deepch](https://github.com/deepch) for the RTSPtoWeb(RTC servers.
