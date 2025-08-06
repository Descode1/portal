import {
  createPeerConnection,
  setRemoteStream,
  setConnectionCleanup,
} from "./peer";
import { sendSignal, subscribeToSignals } from "./signaling";

export const startCall = async (roomId: string): Promise<void> => {
  const pc = createPeerConnection();
  const sender = `user_${Math.floor(100000 + Math.random() * 900000)}`;

  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const localVideo = document.getElementById("local") as HTMLVideoElement;
  if (localVideo) localVideo.srcObject = localStream;

  setRemoteStream(pc, "remote");
  setConnectionCleanup(pc);

  let sentFirstCandidate = false;

  pc.onicecandidate = (event) => {
    if (event.candidate && !sentFirstCandidate) {
      sendSignal(roomId, sender, "candidate", event.candidate);
      sentFirstCandidate = true;
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  subscribeToSignals(roomId, sender, async (type, data) => {
    if (type === "answer") {
      await pc.setRemoteDescription(
        new RTCSessionDescription(data as RTCSessionDescription)
      );
    } else if (type === "candidate") {
      await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidate));
    }
  });

  sendSignal(roomId, sender, "offer", offer);
};
