# Data Access Layer

The Data Access Layer is a centralized library for managing database operations and data retrieval in the crowd.dev platform. It provides a standardized approach to performing CRUD operations on the database while implementing caching strategies for optimal performance.

## 1. What is the Data Access Layer

The Data Access Layer (`@crowd/data-access-layer`) serves as the primary interface for database interactions across the crowd.dev platform. Its main purposes are:

- **Database Abstraction**: Provides a consistent API for database operations regardless of the underlying database technology
- **Query Management**: Centralizes complex SQL queries and database logic in reusable modules  
- **Performance Optimization**: Implements caching strategies and query optimization techniques
- **Type Safety**: Ensures type-safe database operations using TypeScript interfaces
- **Error Handling**: Standardizes database error handling and logging across the platform

The layer acts as a bridge between the application services and the PostgreSQL database, using `pg-promise` as the primary database client.

## 2. How Each Data Access Module is Structured

Each data access module follows a consistent architectural pattern:

### File Structure
```
src/
├── [entity]/
│   ├── index.ts          # Main exports and public API
│   ├── base.ts           # Core CRUD operations and queries
│   ├── types.ts          # TypeScript interfaces and types
│   ├── queryBuilder.ts   # Query construction utilities (optional)
│   └── [specific].ts     # Specialized operations (optional)
```

### Core Components

**Base Operations (`base.ts`)**
- `create()` - Insert new records
- `update()` - Modify existing records  
- `findById()` - Retrieve single record by ID
- `findMany()` - Retrieve multiple records with filtering
- `delete()` - Remove records

**Type Definitions (`types.ts`)**
- Database schema interfaces (`IDb[Entity]Data`)
- API request/response interfaces (`I[Entity]CreateData`, `I[Entity]UpdateData`)
- Query parameter interfaces (`IQuery[Entity]Params`)

**Query Builder (`queryBuilder.ts`)**
- Dynamic SQL query construction
- WHERE clause building
- JOIN operations
- Sorting and pagination logic

### Example Structure (Members Module)
```typescript
// types.ts
export interface IDbMemberData {
  id: string
  displayName: string
  // ... other fields
}

// base.ts  
export async function queryMembersAdvanced(
  params: IQueryMembersAdvancedParams,
  qx: QueryExecutor = getDbInstance()
): Promise<PageData<IDbMemberData>> {
  // Implementation with caching
}
```

## 3. Caching Systems

The Data Access Layer implements multiple caching strategies to optimize performance:

### Redis-Based Caching

**RedisCache Class**
- Used for simple key-value caching operations
- Automatic serialization/deserialization  
- TTL (Time To Live) support
- Cache invalidation utilities

```typescript
import { RedisCache } from '@crowd/redis'

const cache = new RedisCache('entityName', redisClient, logger)
await cache.set('key', data, ttlSeconds)
const cached = await cache.get('key')
```

### Stale-While-Revalidate (SWR) Pattern

**Implementation Strategy**
- Returns cached data immediately when available
- Refreshes cache in background for next request
- Provides optimal user experience with minimal latency
- Handles cache misses gracefully

**Key Features**
- **Immediate Response**: Returns stale data instantly while refreshing
- **Background Refresh**: Updates cache asynchronously without blocking requests  
- **Error Resilience**: Falls back to fresh queries if cache operations fail
- **Configurable TTL**: Customizable cache expiration times (default: 30 minutes)

**Usage Example**
```typescript
// Check cache first
const cached = await cache.get(cacheKey)
if (cached) {
  // Return cached data immediately
  // Refresh cache in background (fire-and-forget)
  void refreshCacheInBackground(params, cacheKey, cache, qx)
  return JSON.parse(cached)
}

// Cache miss - fetch fresh data and cache it
const result = await executeQuery(params, qx)
await cache.set(cacheKey, JSON.stringify(result), TTL_SECONDS)
return result
```

### Cache Invalidation

**Strategies**
- **Time-based**: Automatic expiration using TTL
- **Event-based**: Manual invalidation on data updates
- **Pattern-based**: Bulk invalidation using key patterns

**Best Practices**
- Cache keys should be deterministic and include relevant parameters
- Use appropriate TTL values based on data volatility
- Implement cache warming for frequently accessed data
- Monitor cache hit rates and performance metrics

---

This data access layer provides a robust foundation for database operations while maintaining high performance through intelligent caching strategies. Each module follows consistent patterns to ensure maintainability and developer productivity across the platform.