import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export async function generateLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  isViewer: boolean = false,
): Promise<string> {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    metadata: JSON.stringify({ isViewer }),
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: !isViewer, // Viewers cannot publish video/audio
    canPublishData: true, // Allow chat for everyone
    canSubscribe: true, // Everyone can watch/listen
  });

  return await token.toJwt();
}
