import { createPeerConnection, setRemoteStream, setConnectionCleanup } from "./peer";
import { sendSignal, subscribeToSignals } from "./signaling";

export const joinCall = async (roomId: string): Promise<void> => {
  const pc = createPeerConnection();
  const sender = `user_${Math.floor(100000 + Math.random() * 900000)}`;

  const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const localVideo = document.getElementById("local") as HTMLVideoElement;
  if (localVideo) localVideo.srcObject = localStream;

  setRemoteStream(pc, "remote");
  setConnectionCleanup(pc);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(roomId, sender, "candidate", event.candidate);
    }
  };

  subscribeToSignals(roomId, sender, async (type, data) => {
    if (type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescription));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(roomId, sender, "answer", answer);
    } else if (type === "candidate") {
      await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidate));
    }
  });
};
