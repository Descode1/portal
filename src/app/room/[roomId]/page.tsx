"use client";
import { useParams } from "next/navigation";
import { startCall } from "@/app/Lib/webrtc/caller";
import { joinCall } from "@/app/Lib/webrtc/callee";

export default function RoomPage() {
  const { roomId } = useParams();

  return (
    <div>
      <video id="local" autoPlay muted playsInline></video>
      <video id="remote" autoPlay playsInline></video>
      <button onClick={() => startCall(roomId as string)}>Start Call</button>
      <button onClick={() => joinCall(roomId as string)}>Join Call</button>
    </div>
  );
}
