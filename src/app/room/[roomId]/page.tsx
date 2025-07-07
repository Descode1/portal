'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { sendSignal, subscribeToSignals } from '@/app/Lib/signaling'
import { supabase } from '@/app/Lib/supabaseClient'

export default function RoomPage() {
  const params = useParams()
  const roomId = params?.roomId as string
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [, setSender] = useState<string | null>(null)
  const [, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!roomId) return

    const init = async () => {
      try {
        await supabase
          .from('signals')
          .delete()
          .eq('room_id', roomId)

        const mySender = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSender(mySender)
       
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        localStreamRef.current = localStream

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
        })
        pcRef.current = pc

        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream)
        })

        pc.onicecandidate = event => {
          if (event.candidate) {
            sendSignal(roomId, mySender, 'candidate', event.candidate)
          }
        }

        pc.ontrack = event => {
          const [remoteStream] = event.streams
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
        }
        const subscription = subscribeToSignals(roomId, mySender, async (type, data) => {
          try {
            if (type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit))
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)
              await sendSignal(roomId, mySender, 'answer', answer)
            } else if (type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit))
            } else if (type === 'candidate') {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit))
              }
            }
          } catch (err) {
            console.error(`Error handling ${type}:`, err)
          }
        })

        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: existingSignals } = await supabase
          .from('signals')
          .select('*')
          .eq('room_id', roomId)
          .eq('type', 'offer')
          .neq('sender', mySender)

        const shouldCreateOffer = !existingSignals || existingSignals.length === 0

        if (shouldCreateOffer) {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          await sendSignal(roomId, mySender, 'offer', offer)
        } else {
          console.log('Joining as second user, waiting for offer')
        }
        setIsInitialized(true)
        return () => {
          subscription?.unsubscribe()
          localStream.getTracks().forEach(track => track.stop())
          pc.close()
        }

      } catch (error) {
        console.error('Error initializing room:', error)
      }
    }

    const cleanup = init()

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [roomId])

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-white via-orange-50 to-white text-gray-900 p-4 flex items-center justify-center">
  {/* Remote Video */}
  <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden relative">
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />

    <div className="absolute bottom-2 left-2 text-sm bg-white/60 text-gray-700 backdrop-blur px-3 py-1 rounded-full">
      Peer: {remoteVideoRef.current?.srcObject ? "Connected" : "Waiting..."}
    </div>
  </div>

  <div className="absolute bottom-6 right-6 w-40 h-24 rounded-md overflow-hidden border border-orange-300 bg-black/80">
    <video
      ref={localVideoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  </div>
</main>

  )
}