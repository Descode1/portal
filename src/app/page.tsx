"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid'
export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const handleCreateRoom =()=>{
    const newRoomId = uuidv4();
    router.push(`/room/${newRoomId}`)
  }
  const handleJoinRoom =()=>{
    if(roomId.trim()){
      router.push(`/room/${roomId.trim()}`)
    }
  }
  return (
  <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Video Chat App</h1>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border p-2 rounded"
        />
        <button onClick={handleJoinRoom} className="bg-blue-500 text-white px-4 py-2 rounded">
          Join Room
        </button>
      </div>
      <button onClick={handleCreateRoom} className="bg-green-500 text-white px-4 py-2 rounded">
        Create New Room
      </button>
    </main>
  );
}
