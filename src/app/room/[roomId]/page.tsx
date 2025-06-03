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
  const [sender, setSender] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!roomId) return

    const init = async () => {
      try {
        // Clear any existing signals for this room to avoid conflicts
        await supabase
          .from('signals')
          .delete()
          .eq('room_id', roomId)

        // Generate unique sender ID
        const mySender = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSender(mySender)

        // Get user media
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        localStreamRef.current = localStream

        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
        })
        pcRef.current = pc

        // Add local stream tracks
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream)
        })

        // Handle ICE candidates
        pc.onicecandidate = event => {
          if (event.candidate) {
            console.log('Sending ICE candidate:', event.candidate)
            sendSignal(roomId, mySender, 'candidate', event.candidate)
          }
        }

        // Handle remote stream
        pc.ontrack = event => {
          console.log('Received remote track:', event)
          const [remoteStream] = event.streams
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
        }

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log('Connection state:', pc.connectionState)
        }

        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc.iceConnectionState)
        }

        // Set up signaling subscription BEFORE creating/handling offers
        const subscription = subscribeToSignals(roomId, mySender, async (type, data, signalSender) => {
          try {
            console.log(`Received ${type} from ${signalSender}:`, data)

            if (type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit))
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)
              console.log('Sending answer:', answer)
              await sendSignal(roomId, mySender, 'answer', answer)
            } else if (type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit))
            } else if (type === 'candidate') {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit))
              } else {
                // Queue candidates if remote description not set yet
                console.log('Queueing ICE candidate - remote description not ready')
              }
            }
          } catch (err) {
            console.error(`Error handling ${type}:`, err)
          }
        })

        // Wait a bit for subscription to be established
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if there are existing users in the room
        const { data: existingSignals } = await supabase
          .from('signals')
          .select('*')
          .eq('room_id', roomId)
          .eq('type', 'offer')
          .neq('sender', mySender)

        const shouldCreateOffer = !existingSignals || existingSignals.length === 0

        if (shouldCreateOffer) {
          console.log('Creating offer as first user')
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          console.log('Sending offer:', offer)
          await sendSignal(roomId, mySender, 'offer', offer)
        } else {
          console.log('Joining as second user, waiting for offer')
        }

        setIsInitialized(true)

        // Cleanup function
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
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-4 p-4 items-center justify-center">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-2">You ({sender})</h2>
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className="rounded w-full max-w-md shadow border-2 border-blue-500" 
        />
        <p className="text-sm mt-2 text-gray-600">
          Status: {isInitialized ? 'Connected' : 'Connecting...'}
        </p>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-2">Peer</h2>
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="rounded w-full max-w-md shadow border-2 border-green-500" 
        />
        <p className="text-sm mt-2 text-gray-600">
          Peer Status: {remoteVideoRef.current?.srcObject ? 'Connected' : 'Waiting...'}
        </p>
      </div>
    </main>
  )
}