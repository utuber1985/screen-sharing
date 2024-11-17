import { Socket } from "socket.io-client";

export function createPeerConnection(socket: Socket) {
    const config: RTCConfiguration = {
        iceServers: [
            {
                urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]
            }
        ]
    };

    const peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        const [stream] = event.streams;
        const videoElement = document.querySelector("video");
        if (videoElement) {
            videoElement.srcObject = stream;

            // Ensure audio is enabled
            videoElement.muted = false;
            videoElement.volume = 1;
        }
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "disconnected") {
            // Handle disconnection
            const videoElement = document.querySelector("video");
            if (videoElement) {
                videoElement.srcObject = null;
            }
        }
    };

    return peerConnection;
}
