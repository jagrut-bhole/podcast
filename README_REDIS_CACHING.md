# Redis Caching Implementation

## Overview

Redis caching has been implemented to improve performance by reducing database queries. Data is cached with TTL (Time To Live) and automatically invalidated when updated.

## Setup

### 1. Install Dependencies

```bash
npm install ioredis
npm install -D @types/ioredis
```

### 2. Environment Variables

Add to your `.env`:

```env
REDIS_URL=redis://localhost:6379
```

For production (e.g., Upstash, Redis Cloud):

```env
REDIS_URL=rediss://default:password@host:port
```

### 3. Start Redis (Local Development)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using docker-compose (already in your setup)
docker compose up -d
```

## How It Works

### Cache-Aside Pattern

1. **Request comes in** → Check Redis cache
2. **Cache HIT** → Return cached data (fast!)
3. **Cache MISS** → Query database → Store in cache → Return data
4. **On UPDATE/DELETE** → Invalidate cache → Next request fetches fresh data

### Cache Keys

```typescript
meetings: user: {
  userId;
} // List of user's meetings (5 min TTL)
meeting: {
  meetingId;
} // Single meeting details (10 min TTL)
user: {
  userId;
} // User profile (future use)
```

## API Endpoints with Caching

### GET /api/meetings

```typescript
// Returns cached list of user's meetings
// Cache TTL: 5 minutes
// Invalidated on: POST new meeting
```

**Frontend Usage:**

```typescript
const response = await fetch("/api/meetings");
const { data: meetings } = await response.json();
// First call: queries DB + caches (slower)
// Subsequent calls within 5 min: returns from cache (faster)
```

### GET /api/meetings/[meetingId]

```typescript
// Returns cached meeting details
// Cache TTL: 10 minutes
// Invalidated on: PATCH or DELETE that meeting
```

**Frontend Usage:**

```typescript
const response = await fetch(`/api/meetings/${meetingId}`);
const { data: meeting } = await response.json();
```

### POST /api/meetings

```typescript
// Creates meeting + invalidates user meetings cache
```

### PATCH /api/meetings/[meetingId]

```typescript
// Updates meeting + invalidates both:
// - That meeting's cache
// - User's meetings list cache
```

### DELETE /api/meetings/[meetingId]

```typescript
// Deletes meeting + invalidates both caches
```

## Benefits

### Performance

- **~50-100ms** response from cache
- **~200-500ms** response from database
- **2-5x faster** for cached requests

### Reduced Database Load

- Fewer queries to PostgreSQL
- Better scalability with more users
- Lower hosting costs

### User Experience

- Faster page loads
- Reduced API latency
- Smoother navigation

## Cache Invalidation Strategy

We use **write-through invalidation**:

1. Update database first
2. Delete cache keys
3. Next read will refresh cache

### Example Flow:

```
User updates meeting title:
1. PATCH /api/meetings/123 { title: "New Title" }
2. Update DB ✅
3. Delete cache keys:
   - meeting:123
   - meetings:user:abc
4. User refreshes page
5. GET /api/meetings → Cache MISS → Query DB → Cache result
6. Subsequent requests use fresh cache
```

## Advanced Usage

### Manual Cache Operations

```typescript
import { cache, cacheKeys } from "@/lib/redis";

// Get cached value
const meetings = await cache.get(cacheKeys.userMeetings(userId));

// Set with custom TTL (1 hour)
await cache.set("custom:key", { data: "value" }, 3600);

// Delete specific keys
await cache.del("key1", "key2", "key3");

// Delete by pattern
await cache.delPattern("meetings:user:*");

// Check if exists
const exists = await cache.exists("meeting:123");

// Get or Set (cache-aside helper)
const data = await cache.getOrSet(
  "my:key",
  async () => {
    // Expensive operation (DB query, API call, etc.)
    return await fetchData();
  },
  300, // TTL in seconds
);
```

### User Profile Caching (Example)

```typescript
// In your user API route
import { cache, cacheKeys } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const session = await auth();

  const user = await cache.getOrSet(
    cacheKeys.userProfile(session.user.id),
    async () => {
      return await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true },
      });
    },
    600, // 10 minutes
  );

  return NextResponse.json({ data: user });
}
```

## Monitoring

### Check Redis Connection

```typescript
import { redis } from "@/lib/redis";

// In a health check endpoint
export async function GET() {
  try {
    await redis.ping();
    return NextResponse.json({ redis: "connected" });
  } catch (err) {
    return NextResponse.json({ redis: "disconnected" }, { status: 503 });
  }
}
```

### View Cache in Development

```bash
# Connect to Redis CLI
docker exec -it <redis-container-id> redis-cli

# List all keys
KEYS *

# Get a specific key
GET "meetings:user:abc123"

# Check TTL
TTL "meetings:user:abc123"

# Delete all keys (careful!)
FLUSHALL
```

## Best Practices

1. ✅ **Cache frequently read data** (meetings list, user profiles)
2. ✅ **Set appropriate TTLs** (5-10 min for dynamic data)
3. ✅ **Invalidate on writes** (keep cache fresh)
4. ❌ **Don't cache sensitive data** without encryption
5. ❌ **Don't cache too long** (stale data issues)
6. ✅ **Handle cache failures gracefully** (fallback to DB)

## Troubleshooting

### Redis Not Connected

```
⚠️  Redis not available. Caching disabled
```

**Solution:** Ensure Redis is running (`docker compose up -d`)

### Stale Data in Cache

**Solution:** Clear specific cache or wait for TTL expiry

```typescript
await cache.del(cacheKeys.userMeetings(userId));
```

### Cache Not Invalidating

**Solution:** Check that invalidation is called AFTER DB update, not before

## Next Steps

Consider caching:

- User profiles
- Meeting participants count
- Recent chat messages
- Dashboard statistics
- Frequently accessed settings
