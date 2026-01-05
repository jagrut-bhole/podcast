# Redis Caching Strategies for Your Prisma Schema

## Overview

This guide shows how to effectively cache data from each model in your Prisma schema using Redis.

---

## 1. User Model Caching

### Use Cases

- Cache user profiles (reduce DB queries on auth checks)
- Cache user by email (login lookups)
- Cache user statistics

### Example: Cache User Profile

```typescript
// app/api/users/[userId]/route.ts
import { cache, cacheKeys } from "@/lib/redis";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const user = await cache.getOrSet(
    cacheKeys.user(userId),
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });
    },
    600, // 10 minutes
  );

  return NextResponse.json({ data: user }); 
}
```

### Invalidation Strategy

```typescript
// When user updates profile
await prisma.user.update({ where: { id }, data: updateData });

// Invalidate user cache
await cache.del(cacheKeys.user(userId), cacheKeys.userByEmail(user.email));
```

---

## 2. Meeting Model Caching

### Use Cases

- Cache meeting details (most frequently accessed)
- Cache user's hosted meetings
- Cache live/scheduled meetings list
- Cache meeting by invite code (join flow)

### Example: Cache Meeting by Invite Code

```typescript
// app/api/meetings/join/route.ts
import { cache, cacheKeys } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { inviteCode } = await req.json();

  const meeting = await cache.getOrSet(
    cacheKeys.meetingByInviteCode(inviteCode),
    async () => {
      return await prisma.meeting.findUnique({
        where: { inviteCode },
        select: {
          id: true,
          title: true,
          status: true,
          scheduledAt: true,
          host: {
            select: { 
                id: true, 
                name: true, 
                image: true },
          },
        },
      });
    },
    300, // 5 minutes (shorter TTL for join flow)
  );

  if (!meeting) {
    return NextResponse.json(
      { success: false, message: "Invalid invite code" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: meeting });
}
```

### Example: Cache Live Meetings

```typescript
// app/api/meetings/live/route.ts
export async function GET(req: NextRequest) {
  const liveMeetings = await cache.getOrSet(
    cacheKeys.liveMeetings(),
    async () => {
      return await prisma.meeting.findMany({
        where: { status: "LIVE" },
        select: {
          id: true,
          title: true,
          startedAt: true,
          host: { select: { id: true, name: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 20,
      });
    },
    60, // 1 minute (very short TTL for real-time data)
  );

  return NextResponse.json({ data: liveMeetings });
}
```

### Invalidation Strategy

```typescript
// When meeting status changes (SCHEDULED → LIVE → ENDED)
await prisma.meeting.update({
  where: { id: meetingId },
  data: { status: "LIVE", startedAt: new Date() },
});

// Invalidate multiple caches
await cache.del(
  cacheKeys.meeting(meetingId),
  cacheKeys.meetingByInviteCode(meeting.inviteCode),
  cacheKeys.userMeetings(meeting.hostId),
  cacheKeys.liveMeetings(),
  cacheKeys.scheduledMeetings(),
);
```

---

## 3. Participant Model Caching

### Use Cases

- Cache meeting participants list
- Cache participant count
- Cache user's participation history

### Example: Cache Meeting Participants

```typescript
// app/api/meetings/[meetingId]/participants/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  const participants = await cache.getOrSet(
    cacheKeys.meetingParticipants(meetingId),
    async () => {
      return await prisma.participant.findMany({
        where: { meetingId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      });
    },
    120, // 2 minutes (moderate TTL for participant changes)
  );

  return NextResponse.json({ data: participants });
}
```

### Example: Cache Participant Count

```typescript
// Get participant count (cheaper than full list)
const count = await cache.getOrSet(
  cacheKeys.meetingParticipantCount(meetingId),
  async () => {
    return await prisma.participant.count({
      where: {
        meetingId,
        leftAt: null, // Only active participants
      },
    });
  },
  60, // 1 minute
);
```

### Invalidation Strategy

```typescript
// When participant joins
await prisma.participant.create({
  data: { meetingId, userId, joinedAt: new Date() },
});

// Invalidate participant-related caches
await cache.del(
  cacheKeys.meetingParticipants(meetingId),
  cacheKeys.meetingParticipantCount(meetingId),
  cacheKeys.userParticipations(userId),
  cacheKeys.meeting(meetingId), // Also invalidate meeting (includes participant data)
);
```

---

## 4. ChatMessage Model Caching

### Use Cases

- Cache recent chat messages (last 50-100)
- Cache chat count
- **Don't cache** entire chat history (can be huge)

### Example: Cache Recent Chats

```typescript
// app/api/meetings/[meetingId]/chats/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const limit = 50;

  const recentChats = await cache.getOrSet(
    cacheKeys.recentChats(meetingId, limit),
    async () => {
      return await prisma.chatMessage.findMany({
        where: { meetingId },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { sentAt: "desc" },
        take: limit,
      });
    },
    30, // 30 seconds (very short for real-time chat)
  );

  return NextResponse.json({
    data: recentChats.reverse(), // Oldest first
  });
}
```

### Example: Append New Message to Cache

```typescript
// When new message is sent
export async function POST(req: NextRequest) {
  const { meetingId, message } = await req.json();
  const session = await auth();

  // Save to DB
  const newMessage = await prisma.chatMessage.create({
    data: {
      meetingId,
      userId: session.user.id,
      message,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Update cache: append new message
  const cacheKey = cacheKeys.recentChats(meetingId, 50);
  const cached = await cache.get<any[]>(cacheKey);

  if (cached) {
    // Append and keep last 50
    const updated = [...cached, newMessage].slice(-50);
    await cache.set(cacheKey, updated, 30);
  }

  return NextResponse.json({ success: true, data: newMessage });
}
```

### Invalidation Strategy

```typescript
// Simple approach: invalidate on new message
await cache.del(cacheKeys.recentChats(meetingId, 50));

// Or use WebSocket/Server-Sent Events for real-time chat
// and don't cache at all (better for chat)
```

---

## 5. Recording Model Caching

### Use Cases

- Cache recording status (avoid polling DB)
- Cache recording URL after processing

### Example: Cache Recording Status

```typescript
// app/api/recordings/[meetingId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  const recording = await cache.getOrSet(
    cacheKeys.meetingRecording(meetingId),
    async () => {
      return await prisma.recording.findUnique({
        where: { meetingId },
        select: {
          id: true,
          status: true,
          fileUrl: true,
          durationSeconds: true,
          fileSizeBytes: true,
          createdAt: true,
        },
      });
    },
    status === "PROCESSING" ? 30 : 600, // 30s while processing, 10min when ready
  );

  return NextResponse.json({ data: recording });
}
```

### Invalidation Strategy

```typescript
// When recording status changes (webhook from LiveKit)
await prisma.recording.update({
  where: { id: recordingId },
  data: {
    status: "READY",
    fileUrl: url,
    durationSeconds: duration,
  },
});

// Invalidate cache
await cache.del(cacheKeys.meetingRecording(meetingId));
```

---

## 6. Aggregate/Stats Caching

### Use Cases

- Cache counts and statistics
- Dashboard metrics

### Example: User Meeting Count

```typescript
// Dashboard stats
const stats = await cache.getOrSet(
  cacheKeys.userMeetingCount(userId),
  async () => {
    const [total, live, scheduled, ended] = await Promise.all([
      prisma.meeting.count({ where: { hostId: userId } }),
      prisma.meeting.count({ where: { hostId: userId, status: "LIVE" } }),
      prisma.meeting.count({ where: { hostId: userId, status: "SCHEDULED" } }),
      prisma.meeting.count({ where: { hostId: userId, status: "ENDED" } }),
    ]);

    return { total, live, scheduled, ended };
  },
  300, // 5 minutes
);
```

---

## Complete Caching Strategy by Operation

### Meeting Creation (POST /api/meetings)

```typescript
const meeting = await prisma.meeting.create({ data });

// Invalidate:
await cache.del(
  cacheKeys.userMeetings(hostId),
  cacheKeys.scheduledMeetings(),
  cacheKeys.userMeetingCount(hostId),
);
```

### Meeting Update (PATCH /api/meetings/[id])

```typescript
const meeting = await prisma.meeting.update({ where: { id }, data });

// Invalidate:
await cache.del(
  cacheKeys.meeting(id),
  cacheKeys.userMeetings(meeting.hostId),
  cacheKeys.meetingByInviteCode(meeting.inviteCode),
);

// If status changed:
if (data.status) {
  await cache.del(cacheKeys.liveMeetings(), cacheKeys.scheduledMeetings());
}
```

### Meeting Deletion (DELETE /api/meetings/[id])

```typescript
await prisma.meeting.delete({ where: { id } });

// Invalidate everything related to this meeting:
await cache.delPattern(cacheKeys.meetingPattern(id));
```

### Participant Join

```typescript
await prisma.participant.create({ data });

await cache.del(
  cacheKeys.meetingParticipants(meetingId),
  cacheKeys.meetingParticipantCount(meetingId),
  cacheKeys.meeting(meetingId),
);
```

### Chat Message

```typescript
await prisma.chatMessage.create({ data });

// Option 1: Invalidate (simple)
await cache.del(cacheKeys.recentChats(meetingId, 50));

// Option 2: Use WebSocket instead of caching
```

---

## Performance Guidelines

### What to Cache (High Value)

✅ **User profiles** - Frequently accessed, rarely change
✅ **Meeting details** - Core data, accessed often
✅ **Meeting lists** - Dashboard/home page
✅ **Participant counts** - Lightweight stats
✅ **Recording status** - Polled during processing

### What NOT to Cache

❌ **Full chat history** - Too large, changes frequently
❌ **Live participant positions** - Real-time data (use WebSocket)
❌ **Auth tokens** - Security risk
❌ **Session data** - Already in session store

### TTL Guidelines

- **User profiles**: 10-30 minutes
- **Meeting details**: 5-10 minutes
- **Live meetings**: 1 minute
- **Participants**: 2-5 minutes
- **Recent chats**: 30 seconds or don't cache
- **Recording (processing)**: 30 seconds
- **Recording (ready)**: 10 minutes
- **Stats/counts**: 5 minutes

---

## Example: Complete Caching Wrapper

```typescript
// lib/cache-helpers.ts
import { cache, cacheKeys } from "./redis";
import prisma from "./prisma";

export const cachedQueries = {
  // Get user with caching
  async getUser(userId: string) {
    return cache.getOrSet(
      cacheKeys.user(userId),
      () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, image: true },
        }),
      600,
    );
  },

  // Get meeting with caching
  async getMeeting(meetingId: string) {
    return cache.getOrSet(
      cacheKeys.meeting(meetingId),
      () =>
        prisma.meeting.findUnique({
          where: { id: meetingId },
          include: {
            host: { select: { id: true, name: true, image: true } },
            _count: { select: { participants: true, chatMessages: true } },
          },
        }),
      300,
    );
  },

  // Get meeting by invite code
  async getMeetingByInviteCode(inviteCode: string) {
    return cache.getOrSet(
      cacheKeys.meetingByInviteCode(inviteCode),
      () =>
        prisma.meeting.findUnique({
          where: { inviteCode },
          select: {
            id: true,
            title: true,
            status: true,
            host: { select: { name: true } },
          },
        }),
      300,
    );
  },
};
```

---

## Testing Cache

```typescript
// Test if caching is working
import { redis, cache, cacheKeys } from "@/lib/redis";

// Check connection
await redis.ping(); // Returns "PONG"

// Manual set/get
await cache.set("test:key", { hello: "world" }, 60);
const value = await cache.get("test:key"); // { hello: "world" }

// Check what's cached
const keys = await redis.keys("meeting:*");
console.log("Cached meetings:", keys);

// Clear all cache (development only!)
await redis.flushall();
```

This strategy will significantly improve your app's performance! 🚀
