'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { sendSignal, subscribeToSignals } from '@/app/Lib/signaling'
import { supabase } from '@/app/Lib/supabaseClient'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [sender, setSender] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      // Step 1: Determine if an offer already exists
      const { data: existingOffers } = await supabase
        .from('signals')
        .select('*')
        .eq('room_id', roomId)
        .eq('type', 'offer')

      const isOfferer = !existingOffers || existingOffers.length === 0
      const mySender = isOfferer ? 'user1' : 'user2'
      setSender(mySender)

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localVideoRef.current!.srcObject = localStream
      localStreamRef.current = localStream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      pcRef.current = pc

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

      pc.onicecandidate = event => {
        if (event.candidate) {
          sendSignal(roomId, mySender, 'candidate', event.candidate)
        }
      }

      pc.ontrack = event => {
        const [remoteStream] = event.streams
        remoteVideoRef.current!.srcObject = remoteStream
      }

      subscribeToSignals(roomId, mySender, async (type, data) => {
        if (!pc) return

        if (type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignal(roomId, mySender, 'answer', answer)
        } else if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data))
        } else if (type === 'candidate') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data))
          } catch (err) {
            console.error('Error adding ICE candidate', err)
          }
        }
      })

      if (isOfferer) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendSignal(roomId, mySender, 'offer', offer)
      }
    }

    init()
  }, [roomId])

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-4 p-4 items-center justify-center">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-2">You ({sender})</h2>
        <video ref={localVideoRef} autoPlay muted playsInline className="rounded w-full max-w-md shadow" />
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-2">Peer</h2>
        <video ref={remoteVideoRef} autoPlay playsInline className="rounded w-full max-w-md shadow" />
      </div>
    </main>
  )
}
