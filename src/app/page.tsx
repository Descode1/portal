"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = () => {
    const newId = uuidv4();
    setCreatedRoomId(newId);
    setCopied(false);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  const handleJoinCreatedRoom = () => {
    if (createdRoomId) {
      router.push(`/room/${createdRoomId}`);
    }
  };

  const handleShare = () => {
    if (createdRoomId) {
      const link = `${window.location.origin}/room/${createdRoomId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-white via-orange-50 to-white text-gray-900 px-6 py-8">
      <div className="flex justify-center">
        <h1 className="text-4xl font-bold mb-16">Portal</h1>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleCreateRoom}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-full transition"
        >
          Create New Portal
        </button>

        {createdRoomId && (
          <div className="flex flex-col items-center gap-2 text-orange-700 mt-2">
            <p className="text-sm">Portal created: <span className="font-mono">{createdRoomId}</span></p>
            <div className="flex gap-2">
              <button
                onClick={handleJoinCreatedRoom}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm"
              >
                Join Portal
              </button>
              <button
                onClick={handleShare}
                className="bg-orange-100 hover:bg-orange-200 text-orange-600 px-4 py-1.5 rounded-full text-sm"
              >
                {copied ? "Link Copied!" : "Share Portal"}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-8">
          <input
            type="text"
            placeholder="Enter Portal ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-white/60 backdrop-blur border border-orange-300 rounded-full px-4 py-2 outline-none placeholder:text-orange-400 text-sm"
          />
          <button
            onClick={handleJoinRoom}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full transition"
          >
            Join Portal
          </button>
        </div>
      </div>
    </main>
  );
}
