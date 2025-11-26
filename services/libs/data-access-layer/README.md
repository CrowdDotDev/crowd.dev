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
│   ├── constants.ts      # Module-specific constants and configuration
│   ├── queryBuilder.ts   # Query construction utilities (optional)
│   ├── utils.ts          # Entity-specific helpers (discouraged)
│   ├── [specific].ts     # Specialized operations (only if necessary)
│   └── __tests__/        # Unit tests for entity module
├── utils/                # Shared helper functions for all entities
│   ├── index.ts          # Common utility exports
│   ├── validation.ts     # Data validation utilities
│   ├── formatting.ts     # Data formatting and transformation
│   └── __tests__/        # Unit tests for shared utilities
```

### Entity Responsibility and Data Ownership

**Critical Rule: Single Table Ownership**
Each entity module **MUST** have exclusive responsibility for its corresponding database table. This architectural principle ensures:

- **Data Integrity**: Only the entity that owns a table can perform CRUD operations on it
- **Clear Boundaries**: Prevents coupling between different entity modules
- **Maintainability**: Changes to table structure only affect the owning entity
- **Debugging Simplicity**: All operations on a table are centralized in one place

**❌ FORBIDDEN: Cross-Entity CRUD Operations**
```typescript
// ❌ NEVER do this - Members entity performing CRUD on organizations table
// File: src/members/base.ts
export async function updateMemberOrganization(memberId: string, orgData: any) {
  return qx.query('UPDATE organizations SET name = $1 WHERE id = $2', [orgData.name, orgData.id])
}
```

**✅ CORRECT: Entity Owns Its Table**
```typescript
// ✅ Members entity only operates on members table
// File: src/members/base.ts  
export async function updateMember(memberId: string, memberData: IUpdateMemberData) {
  return qx.query('UPDATE members SET display_name = $1 WHERE id = $2', [memberData.displayName, memberId])
}

// ✅ Organizations entity operates on organizations table
// File: src/organizations/base.ts
export async function updateOrganization(orgId: string, orgData: IUpdateOrganizationData) {
  return qx.query('UPDATE organizations SET name = $1 WHERE id = $2', [orgData.name, orgId])
}
```

**Handling Cross-Entity Operations**
When business logic requires operations across multiple entities, use service layer coordination:

```typescript
// ✅ Service layer coordinates multiple entities
// File: services/member-service.ts
import { updateMember } from '@crowd/data-access-layer/src/members'
import { updateOrganization } from '@crowd/data-access-layer/src/organizations'

export async function updateMemberAndOrganization(memberId: string, orgId: string, data: any) {
  await updateMember(memberId, data.memberData)
  await updateOrganization(orgId, data.organizationData)
}
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

**Constants (`constants.ts`)**
- Cache TTL values and cache key prefixes
- Query limits and pagination defaults
- Performance thresholds and timeouts
- Default sorting and filtering options
- Table and column names

**Query Builder (`queryBuilder.ts`)**
- Dynamic SQL query construction
- WHERE clause building
- JOIN operations
- Sorting and pagination logic

**Entity-Specific Utilities (`utils.ts`) - DISCOURAGED**
- Entity-specific helper functions (use sparingly)
- Should be avoided in favor of shared utilities when possible
- If used, must only operate on the entity's own table
- Consider moving to `/utils/` if the functionality could be reused

**Shared Utilities (`/utils/` directory)**
- Common helper functions used across multiple entities
- SQL query construction utilities
- Caching and validation helpers
- Data formatting and transformation utilities
- Should be the preferred location for reusable functionality

### Example Structure (Members Module)
```typescript
// constants.ts
export const MEMBER_CONSTANTS = {
  CACHE: {
    TTL_SECONDS: 1800, // 30 minutes
    KEY_PREFIX: 'member',
  },
  QUERY: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 1000,
    DEFAULT_ORDER_BY: 'joinedAt',
  },
  PERFORMANCE: {
    SLOW_QUERY_THRESHOLD_MS: 5000,
  },
  TABLE: {
    NAME: 'members',
    COLUMNS: {
      ID: 'id',
      DISPLAY_NAME: 'displayName',
      JOINED_AT: 'joinedAt',
    }
  }
} as const

// types.ts
export interface IDbMemberData {
  id: string
  displayName: string
  // ... other fields
}

// base.ts  
import { MEMBER_CONSTANTS } from './constants'

export async function queryMembersAdvanced(
  params: IQueryMembersAdvancedParams,
  qx: QueryExecutor = getDbInstance()
): Promise<PageData<IDbMemberData>> {
  // Implementation using constants for TTL, limits, etc.
  const cacheKey = `${MEMBER_CONSTANTS.CACHE.KEY_PREFIX}:advanced:${hash(params)}`
  // ... rest of implementation
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

## 4. Logging Best Practices

Proper logging is essential for monitoring database operations, debugging issues, and maintaining system observability. The Data Access Layer follows structured logging practices to ensure comprehensive visibility into database interactions.

### Logging Levels and When to Use Them

**ERROR Level**
- Database connection failures
- Query execution errors (syntax errors, constraint violations)
- Transaction rollback scenarios
- Cache operation failures that affect functionality

```typescript
log.error('Failed to execute member query', { 
  error: error.message, 
  query: sanitizedQuery,
  params: sanitizedParams,
  tenantId 
})
```

**WARN Level**
- Cache misses on critical queries
- Slow query performance (exceeding thresholds)
- Fallback operations (e.g., cache failure, using direct DB)
- Deprecated query patterns or methods

```typescript
log.warn('Query execution time exceeded threshold', {
  executionTime: `${duration}ms`,
  threshold: `${SLOW_QUERY_THRESHOLD}ms`,
  operation: 'queryMembersAdvanced'
})
```

**INFO Level**
- Successful database operations with significant business impact
- Cache refresh operations
- Bulk operations completion
- Migration or schema changes

```typescript
log.info('Cache refreshed successfully', {
  cacheKey,
  operation: 'memberQuery',
  refreshType: 'background',
  recordCount: result.data.length
})
```

**DEBUG Level**
- Query execution details in development
- Cache hit/miss statistics
- Parameter sanitization details
- Performance metrics for optimization

```typescript
log.debug('Query executed successfully', {
  operation: 'queryMembersAdvanced',
  executionTime: `${duration}ms`,
  cacheHit: false,
  resultCount: result.totalCount
})
```

### What to Log

**Always Include**
- **Operation Context**: Method name, entity type, operation type (CRUD)
- **Tenant Information**: `tenantId` for multi-tenant operations
- **Performance Data**: Execution time, record counts
- **Error Details**: Error messages, stack traces (sanitized)

**Query Logging**
- **Sanitized Queries**: Log SQL with parameter placeholders, never actual values
- **Parameter Metadata**: Types and counts, not sensitive values
- **Query Plans**: For slow query analysis (development/staging only)

**Cache Logging**
- **Cache Operations**: Hit/miss, refresh, invalidation events
- **Cache Keys**: For debugging cache behavior
- **TTL Information**: Expiration times and refresh schedules

### Sensitive Data Handling

**Never Log**
- Personal Identifiable Information (PII)
- Authentication tokens or credentials
- Raw query parameters containing sensitive data
- Full database records containing user data

**Safe Logging Patterns**
```typescript
// ❌ NEVER do this
log.info('User query executed', { email: user.email, query })

// ✅ DO this instead
log.info('User query executed', { 
  userId: user.id.substring(0, 8) + '...',
  queryType: 'findByEmail',
  resultCount: results.length
})
```

### Structured Logging Format

Use consistent structured logging with standardized fields:

```typescript
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

// Standard log structure
log.info('Database operation completed', {
  operation: 'queryMembersAdvanced',
  tenantId,
  executionTime: duration,
  resultCount: result.totalCount,
  cacheUsed: Boolean(cached),
  timestamp: new Date().toISOString()
})
```

### Performance Monitoring

**Query Performance Tracking**
```typescript
const startTime = Date.now()
try {
  const result = await executeQuery(params, qx)
  const duration = Date.now() - startTime
  
  if (duration > SLOW_QUERY_THRESHOLD) {
    log.warn('Slow query detected', {
      operation: 'queryMembersAdvanced',
      duration: `${duration}ms`,
      params: Object.keys(params) // Keys only, not values
    })
  }
  
  return result
} catch (error) {
  const duration = Date.now() - startTime
  log.error('Query failed', {
    operation: 'queryMembersAdvanced',
    duration: `${duration}ms`,
    error: error.message
  })
  throw error
}
```


This data access layer provides a robust foundation for database operations while maintaining high performance through intelligent caching strategies. Each module follows consistent patterns to ensure maintainability and developer productivity across the platform.

---

## 5. Current Violation Examples

The following examples demonstrate **real violations** found in the current codebase that break the entity responsibility rules. These should serve as learning examples of what NOT to do and require refactoring to follow proper architectural patterns.

### Violation 1: Members Enrichment Worker Modifying Organizations Table

**Location:** `/services/libs/data-access-layer/src/old/apps/members_enrichment_worker/index.ts`

**❌ Problem Code:**
```typescript
// VIOLATION: members_enrichment_worker inserting into organizations table
export async function insertOrganization(
  tx: DbTransaction,
  tenantId: string,
  company: string,
  location: string,
): Promise<string> {
  const id = generateUUIDv4()
  await tx.none(
    `INSERT INTO organizations (id, "tenantId", "displayName", location, "createdAt", "updatedAt")
     VALUES ($(id), $(tenantId), $(displayName), $(location), now(), now())`,
    {
      id,
      tenantId,
      displayName: company,
      location,
    },
  )
  return id
}
```

**Why This Is Wrong:**
- The `members_enrichment_worker` module is performing INSERT operations on the `organizations` table
- This creates tight coupling between member enrichment logic and organization data management
- Changes to the organizations table structure could break the member enrichment worker
- It's impossible to know all places that modify organizations without searching the entire codebase

**✅ Correct Approach:**
```typescript
// Service layer coordinates entity operations
import { createOrganization } from '@crowd/data-access-layer/src/organizations'

export async function enrichMemberWithOrganization(memberId: string, orgData: any) {
  // Let the organizations entity handle organization creation
  const orgId = await createOrganization({
    tenantId: orgData.tenantId,
    displayName: orgData.company,
    location: orgData.location,
  })
  
  // Handle member-organization relationship through proper channels
  await linkMemberToOrganization(memberId, orgId)
}
```

### Violation 2: Entity Merging Worker Operating on Multiple Tables

**Location:** `/services/libs/data-access-layer/src/old/apps/entity_merging_worker/index.ts`

**❌ Problem Code:**
```typescript
// VIOLATION: Cross-entity CRUD operations in a single module
export async function cleanupMember(db: DbStore, memberId: string) {
  return db.connection().query(
    `DELETE FROM members WHERE id = $1`,
    [memberId],
  )
}

export async function markOrganizationAsManuallyCreated(
  db: DbStore,
  organizationId: string,
): Promise<void> {
  return db.connection().query(
    `UPDATE organizations set "manuallyCreated" = true WHERE "id" = $1`,
    [organizationId],
  )
}
```

**Why This Is Wrong:**
- A single module (`entity_merging_worker`) is performing CRUD operations on both `members` AND `organizations` tables
- This violates the single responsibility principle at the data access layer
- Makes it difficult to track all operations affecting each entity
- Creates hidden dependencies between merging logic and multiple entity schemas

**✅ Correct Approach:**
```typescript
// Service layer coordinates multiple entity operations
import { deleteMember } from '@crowd/data-access-layer/src/members'
import { updateOrganization } from '@crowd/data-access-layer/src/organizations'

export async function performEntityMerging(memberId: string, organizationId: string) {
  // Each entity handles its own operations
  await deleteMember(memberId)
  await updateOrganization(organizationId, { manuallyCreated: true })
}
```

### Violation 3: Organization Operations Outside Organizations Module

**Location:** `/services/libs/data-access-layer/src/old/apps/entity_merging_worker/orgs.ts`

**❌ Problem Code:**
```typescript
// VIOLATION: DELETE operation on organizations from non-organizations module
export async function deleteOrganizationById(db: DbStore, organizationId: string) {
  await db.connection().query(
    `DELETE FROM organizations WHERE id = $1`,
    [organizationId],
  )
}
```

**Why This Is Wrong:**
- Organization deletion logic is implemented outside the `organizations` entity module
- This bypasses any business logic, validation, or cascading operations that should happen in the organizations module
- Creates duplicate and potentially inconsistent deletion logic
- Makes it impossible to implement organization-specific cleanup or audit trails

**✅ Correct Approach:**
```typescript
// Use the organizations entity for all organization operations
import { deleteOrganization } from '@crowd/data-access-layer/src/organizations'

export async function cleanupEntityMerging(organizationId: string) {
  // Let the organizations module handle its own deletion logic
  await deleteOrganization(organizationId)
}
```

### Violation 4: Organizations Module Modifying Member Relationships

**Location:** `/services/libs/data-access-layer/src/organizations/base.ts` (Active Code)

**❌ Problem Code:**
```typescript
// VIOLATION: Organizations entity inserting into memberOrganizations table
export async function addOrgsToMember(
  qe: QueryExecutor,
  memberId: string,
  orgs: IOrganizationIdSource[],
): Promise<void> {
  const query = `
  insert into "memberOrganizations"("organizationId", "memberId", "createdAt", "updatedAt", "source")
  values ${valueString}
  on conflict do nothing;
  `
  await qe.selectNone(query, parameters)
}
```

**Why This Is Wrong:**
- The `organizations` entity is directly manipulating the `memberOrganizations` table
- This table represents a relationship that should be managed by a dedicated relationship entity or the members entity
- Creates coupling between organization logic and member-organization relationship management
- Makes it unclear which entity owns the relationship data

**✅ Correct Approach:**
```typescript
// Service layer coordinates relationship creation
import { createMemberOrganizationRelationship } from '@crowd/data-access-layer/src/member-organization-relationships'

export async function linkOrganizationsToMember(memberId: string, orgIds: string[]) {
  // Let the relationship entity handle the relationship creation
  for (const orgId of orgIds) {
    await createMemberOrganizationRelationship({
      memberId,
      organizationId: orgId,
      source: 'enrichment'
    })
  }
}
```

### Violation 5: Activities Module Modifying Activity Relations

**Location:** `/services/libs/data-access-layer/src/activities/sql.ts` (Active Code)

**❌ Problem Code:**
```typescript
// VIOLATION: Activities entity updating activityRelations table
export async function updateActivityRelationsById(
  qe: QueryExecutor,
  data: IActivityRelationUpdateById,
): Promise<void> {
  const query = `UPDATE "activityRelations" SET ${fields.join(', ')}, "updatedAt" = now() WHERE "activityId" = $(activityId)`
  await qe.result(query, data)
}
```

**Why This Is Wrong:**
- The `activities` entity is directly updating the `activityRelations` table
- The `activityRelations` table should be managed by its own dedicated entity module
- This creates confusion about which entity owns relationship data
- Makes it difficult to implement relationship-specific business logic and validation

**✅ Correct Approach:**
```typescript
// Use the activityRelations entity for relationship updates
import { updateActivityRelation } from '@crowd/data-access-layer/src/activityRelations'

export async function updateActivityWithRelations(activityId: string, relationData: any) {
  // Let the activityRelations entity handle its own updates
  await updateActivityRelation(activityId, relationData)
}
```

### Violation 6: Integrations Module Operating on Multiple Domain Tables

**Location:** `/services/libs/data-access-layer/src/integrations/index.ts` (Active Code)

**❌ Problem Code:**
```typescript
// VIOLATION: Integrations entity inserting into githubRepos and git.repositories tables
export async function insertGithubRepo(qx: QueryExecutor, ...): Promise<void> {
  await qx.result(
    `insert into "githubRepos"("tenantId", "integrationId", "segmentId", url)
     values($(tenantId), $(integrationId), ...)`
  )
}

export async function upsertRepositories(qx: QueryExecutor, ...): Promise<void> {
  await qx.result(
    `INSERT INTO git.repositories (id, url, "integrationId", "segmentId", "forkedFrom")
     VALUES ${placeholdersString}
     ON CONFLICT (id) DO UPDATE SET...`
  )
}
```

**Why This Is Wrong:**
- The `integrations` entity is performing CRUD operations on domain-specific tables (`githubRepos`, `git.repositories`)
- These tables represent different domains (GitHub-specific and Git-specific repositories)
- Creates tight coupling between integration logic and repository management
- Makes it impossible to implement repository-specific business rules independently

**✅ Correct Approach:**
```typescript
// Service layer coordinates multiple domain operations
import { createGithubRepo } from '@crowd/data-access-layer/src/github-repositories'
import { createGitRepository } from '@crowd/data-access-layer/src/git-repositories'

export async function setupIntegrationRepositories(integrationData: any) {
  // Each domain entity handles its own data
  await createGithubRepo(integrationData.githubRepo)
  await createGitRepository(integrationData.gitRepo)
}
```

### Impact of These Violations

**Maintainability Issues:**
- Changes to table schemas require updates in multiple, unrelated modules
- Business logic is scattered across the codebase instead of centralized
- Testing becomes complex as you need to mock multiple unrelated dependencies

**Debugging Difficulties:**
- When investigating organization-related issues, you must search beyond the organizations module
- Data inconsistencies can be introduced by bypassing entity-specific business rules
- Performance optimizations in one entity can be undermined by direct SQL in other modules

**Development Overhead:**
- Developers need to know about cross-module dependencies when making changes
- Code reviews become more complex as changes in one area can affect unrelated functionality
- Onboarding new developers is harder due to hidden coupling between modules

### Refactoring Guidelines

To fix these violations:

1. **Identify Cross-Entity Operations:** Search for SQL operations on tables that don't match the module name
2. **Extract Entity-Specific Logic:** Move all CRUD operations to their respective entity modules
3. **Create Service Layer Coordination:** Use service layer functions to coordinate operations across multiple entities
4. **Update Imports:** Replace direct database calls with proper entity module function calls
5. **Add Integration Tests:** Ensure service layer coordination works correctly across entity boundaries

These examples demonstrate why strict entity responsibility is crucial for maintaining a clean, scalable, and maintainable data access layer.

---

## 6. Transaction Management

Transaction management is critical for maintaining data consistency and integrity across database operations. The Data Access Layer provides a standardized approach to handle transactions that is simple, testable, and robust.

### Current Challenges

The current codebase shows **inconsistent transaction patterns**:

**❌ Legacy Pattern (Manual Management):**
```typescript
// Backend services - manual transaction management
const transaction = await SequelizeRepository.createTransaction(options)
try {
  const result = await SomeRepository.create(data, { ...options, transaction })
  await SequelizeRepository.commitTransaction(transaction)
  return result
} catch (error) {
  await SequelizeRepository.rollbackTransaction(transaction)
  throw error
}
```

**✅ Modern Pattern (QueryExecutor):**
```typescript
// Data access layer - automatic transaction management
await qx.tx(async (tx) => {
  await tx.result('DELETE FROM "memberOrganizations" WHERE ...', params)
  await tx.result('INSERT INTO "memberOrganizations" ...', data)
})
```

### Recommended Transaction Architecture

**Transaction Boundaries Should Be at the Service Layer**

```typescript
// ✅ CORRECT: Service layer manages transaction scope
// File: services/member-organization-service.ts
import { getDbInstance } from '@crowd/data-access-layer'
import { updateMember } from '@crowd/data-access-layer/src/members'
import { createOrganization } from '@crowd/data-access-layer/src/organizations'

export async function createMemberWithOrganization(memberData: any, orgData: any) {
  const qx = getDbInstance()
  
  return qx.tx(async (tx) => {
    // All operations use the same transaction context
    const memberId = await updateMember(tx, memberData)
    const orgId = await createOrganization(tx, orgData)
    await linkMemberToOrganization(tx, memberId, orgId)
    
    return { memberId, orgId }
  })
}
```

**Entity Functions Accept QueryExecutor**

```typescript
// ✅ CORRECT: Entity functions are transaction-agnostic
// File: src/members/base.ts
export async function updateMember(
  qx: QueryExecutor,
  memberId: string,
  data: IUpdateMemberData
): Promise<void> {
  // Works both inside and outside transactions
  await qx.result(
    'UPDATE members SET "displayName" = $(displayName) WHERE id = $(memberId)',
    { displayName: data.displayName, memberId }
  )
}

// File: src/organizations/base.ts
export async function createOrganization(
  qx: QueryExecutor,
  data: ICreateOrganizationData
): Promise<string> {
  const result = await qx.selectOne(
    'INSERT INTO organizations (...) VALUES (...) RETURNING id',
    data
  )
  return result.id
}
```

### Transaction Patterns

**1. Single Entity Operations (No Transaction Required)**
```typescript
// Simple operations don't need explicit transactions
const member = await findMemberById(qx, memberId)
await updateMemberLastSeen(qx, memberId, new Date())
```

**2. Multi-Entity Operations (Service Layer Transaction)**
```typescript
// Complex business operations require coordination
export async function mergeTwoMembers(primaryId: string, secondaryId: string) {
  return qx.tx(async (tx) => {
    // Move all activities from secondary to primary
    await transferMemberActivities(tx, secondaryId, primaryId)
    
    // Move all identities from secondary to primary
    await transferMemberIdentities(tx, secondaryId, primaryId)
    
    // Delete secondary member
    await deleteMember(tx, secondaryId)
    
    // Update primary member aggregations
    await recalculateMemberAggregations(tx, primaryId)
  })
}
```

**3. Nested Transactions (Already Handled Automatically)**
```typescript
// The QueryExecutor handles nested transactions automatically
export async function processUserBatch(userIds: string[]) {
  return qx.tx(async (tx) => {
    for (const userId of userIds) {
      // This calls another service that might also use transactions
      await processIndividualUser(tx, userId) // Uses same tx context
    }
  })
}
```

### Testing Transaction Scenarios

**Entity Functions Are Easy to Test**
```typescript
// __tests__/members/base.test.ts
describe('updateMember', () => {
  it('should update member display name', async () => {
    // Create a test QueryExecutor (can be mocked)
    const mockQx = createMockQueryExecutor()
    
    await updateMember(mockQx, 'member-123', { displayName: 'New Name' })
    
    expect(mockQx.result).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE members'),
      expect.objectContaining({ displayName: 'New Name' })
    )
  })
  
  it('should work within a transaction', async () => {
    const realQx = getDbInstance()
    
    await realQx.tx(async (tx) => {
      await updateMember(tx, 'member-123', { displayName: 'Tx Name' })
      // Test rollback scenarios, etc.
    })
  })
})
```

**Service Layer Transactions Are Integration Tests**
```typescript
// __tests__/services/member-service.test.ts
describe('createMemberWithOrganization', () => {
  it('should rollback if organization creation fails', async () => {
    const memberData = { displayName: 'Test Member' }
    const invalidOrgData = { /* missing required fields */ }
    
    await expect(
      createMemberWithOrganization(memberData, invalidOrgData)
    ).rejects.toThrow()
    
    // Verify no partial data was saved
    const member = await findMemberByEmail(memberData.email)
    expect(member).toBeNull()
  })
})
```

### Key Benefits of This Approach

**Simplicity**
- Entity functions don't manage transactions
- Service layer handles all coordination
- Automatic rollback on any error

**Testability**
- Entity functions can be unit tested with mocked QueryExecutor
- Service transactions are integration-tested
- Easy to test rollback scenarios

**Robustness**
- Consistent error handling and rollback
- No manual commit/rollback management
- Nested transactions handled automatically
- Query executor abstracts database differences (pg-promise vs Sequelize)

**Performance**
- Single transaction for complex operations
- Reduced database round trips
- Connection pooling handled at lower layers

### Migration Strategy

**Phase 1: Standardize Entity Functions**
- Ensure all entity functions accept `QueryExecutor` as first parameter
- Remove direct database connection usage in entity functions

**Phase 2: Refactor Service Layer**
- Replace manual transaction management with `qx.tx()` pattern
- Move transaction boundaries to service layer

**Phase 3: Cleanup Legacy Code**
- Remove `SequelizeRepository.createTransaction()` usage
- Consolidate on QueryExecutor pattern across all layers