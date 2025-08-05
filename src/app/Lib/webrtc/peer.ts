export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
    ],
  });
};

export const setRemoteStream = (pc: RTCPeerConnection, elementId: string) => {
  pc.ontrack = (event) => {
    const remoteStream = event.streams[0];
    const remoteVideo = document.getElementById(elementId) as HTMLVideoElement;
    if (remoteVideo) remoteVideo.srcObject = remoteStream;
  };
};

export const setConnectionCleanup = (pc: RTCPeerConnection) => {
  pc.onconnectionstatechange = () => {
    if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
      pc.close();
    }
  };
};
