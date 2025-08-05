import { useParams } from "next/navigation";
import { sendSignal, subscribeToSignals } from "./signaling";
const params = useParams();
const roomId = params?.roomId as string;

export const signalInit = async (): Promise<void> => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:5349" },
    ],
  });

  const sender = `user_${Math.floor(100000 + Math.random() * 900000)}_`;
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });
  const localVideo = document.getElementById("local") as HTMLVideoElement;
  if (localVideo) localVideo.srcObject = localStream;

  pc.ontrack = (event) => {
    const remoteStream = event.streams[0];
    const remoteVideo = document.getElementById("remote") as HTMLVideoElement;
    if (remoteVideo) remoteVideo.srcObject = remoteStream;
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(roomId, sender, "candidate", event.candidate);
    }
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  subscribeToSignals(roomId, sender, async (type, data) => {
    if (type === "answer") {
      await pc.setRemoteDescription(
        new RTCSessionDescription(data as RTCSessionDescription)
      );
    }
  });
};

export const subToSignal = async (): Promise<void> => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:5349" },
    ],
  });
  const sender = `user_${Math.floor(100000 + Math.random() * 900000)}_`;
  pc.ontrack = (event) => {
    const remoteStream = event.streams[0];
    const remoteVideo = document.getElementById("remote") as HTMLVideoElement;
    if (remoteVideo) remoteVideo.srcObject = remoteStream;
  };

  subscribeToSignals(roomId, sender, async (type, data) => {
    if (type === "offer") {
      await pc.setRemoteDescription(
        new RTCSessionDescription(data as RTCSessionDescription)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(roomId, sender, "answer", answer);
    } else if (type === "candidate") {
      await pc.addIceCandidate(
        new RTCIceCandidate(data as RTCIceCandidateInit)
      );
    }
  });
};
