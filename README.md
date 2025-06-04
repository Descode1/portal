# Portal

A simple peer-to-peer video chat application where users can join rooms and video call each other directly through their browsers.

## What it is
A real-time video chat app built with Next.js that connects two users in the same room for direct video communication.

## What it does
- Create or join video chat rooms using room IDs
- Stream video and audio between users in real-time
- Connect peers directly without going through a server

## What makes it run

### Tech Stack
- **Next.js** - React framework
- **WebRTC** - Peer-to-peer video/audio streaming
- **Supabase** - Real-time signaling database
- **Tailwind CSS** - Styling

### Quick Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Setup Supabase**
   - Create a Supabase project
   - Run this SQL to create the signals table:
   ```sql
   CREATE TABLE signals (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     room_id TEXT NOT NULL,
     sender TEXT NOT NULL,
     type TEXT NOT NULL,
     data JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
   - Enable real-time for the `signals` table

3. **Add environment variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. **Test it**
   - Go to `localhost:3000/room/[roomId]` in two browser tabs
   - Allow camera/microphone access
   - You should see video streams in both tabs

That's it! The app uses WebRTC for direct video streaming and Supabase for coordinating the initial connection between peers.
