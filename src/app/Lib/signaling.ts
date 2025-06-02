import { supabase } from './supabaseClient'

type SignalType = 'offer' | 'answer' | 'candidate'

interface SignalPayload {
  room_id: string
  sender: string
  type: SignalType
  data: RTCSessionDescriptionInit | RTCIceCandidateInit
}

export async function sendSignal(
  roomId: string,
  sender: string,
  type: SignalType,
  data: RTCSessionDescriptionInit | RTCIceCandidateInit
): Promise<void> {
  const payload: SignalPayload = {
    room_id: roomId,
    sender,
    type,
    data,
  }

  await supabase.from('signals').insert([payload])
}

export function subscribeToSignals(
  roomId: string,
  selfSender: string,
  callback: (type: SignalType, data: RTCSessionDescriptionInit | RTCIceCandidateInit) => void
) {
  return supabase
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
          callback(signal.type, signal.data)
        }
      }
    )
    .subscribe()
}
