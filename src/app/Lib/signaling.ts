import { supabase } from './supabaseClient'

export const sendSignal = async (roomId: string, sender: string, type: string, data: any) => {
  await supabase.from('signals').insert([{ room_id: roomId, sender, type, data }])
}

export const subscribeToSignals = (
  roomId: string,
  sender: string,
  callback: (type: string, data: any) => void
) => {
  return supabase
    .channel('signals-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'signals',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const signal = payload.new as any
        if (signal.sender !== sender) {
          callback(signal.type, signal.data)
        }
      }
    )
    .subscribe()
}
