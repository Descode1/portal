import { supabase } from './supabaseClient'

type SignalType = 'offer' | 'answer' | 'candidate'

interface SignalPayload {
  room_id: string
  sender: string
  type: SignalType
  data: RTCSessionDescriptionInit | RTCIceCandidateInit
  created_at?: string
}

export async function sendSignal(
  roomId: string,
  sender: string,
  type: SignalType,
  data: RTCSessionDescriptionInit | RTCIceCandidateInit 
): Promise <void> {
  const payload: SignalPayload = {
    room_id: roomId,
    sender,
    type,
    data,
  } 
  const { error } = await supabase.from('signals').insert([payload])
  if (error) {
    console.error('Error sending signal:', error)
    throw error
  }
}

export function subscribeToSignals(
  roomId: string,
  selfSender: string,
  callback: (type: SignalType, data: RTCSessionDescriptionInit | RTCIceCandidateInit, sender: string) => void
) {
  console.log(`Subscribing to signals for room ${roomId} as ${selfSender}`)

  const channel = supabase
    .channel('room-' + roomId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'signals',
        filter: `room_id=eq.${roomId}`,
      },
      payload => {
        const signal = payload.new as SignalPayload
        if (signal.sender !== selfSender) {
          callback(signal.type, signal.data, signal.sender)
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })
  return channel
}