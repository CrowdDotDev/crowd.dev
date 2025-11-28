# Data Access Layer

A centralized library for database operations and data retrieval in crowd.dev, providing standardized CRUD operations with intelligent caching and strict architectural guidelines.

## Overview

The Data Access Layer (`@crowd/data-access-layer`) ensures:
- **Type-safe database operations** with TypeScript interfaces
- **Single entity responsibility** - each module owns exactly one table
- **Transaction-aware operations** using QueryExecutor pattern
- **Redis-based caching** with stale-while-revalidate (SWR)
- **Complete JSDoc documentation** for all public functions

## Architecture

### File Structure
Each entity follows a standardized structure with explicit versioning:
```
src/[entity]/
├── index.ts          # Version router (points to latest)
├── __tests__/        # Integration tests across versions
├── v1/               # Version 1 (legacy)
│   ├── index.ts      # V1 API exports
│   ├── base.ts       # V1 CRUD operations
│   ├── types.ts      # V1 interfaces
│   ├── constants.ts  # V1 configuration
│   └── __tests__/    # V1 unit tests
└── v2/               # Version 2 (current)
    ├── index.ts      # V2 API exports
    ├── base.ts       # V2 CRUD operations
    ├── types.ts      # V2 interfaces
    ├── constants.ts  # V2 configuration
    ├── queryBuilder.ts # V2 query utilities (optional)
    └── __tests__/    # V2 unit tests
```

**Versioning Logic:**
- **Root `index.ts`**: Routes to latest version (smart default)
- **Explicit versions (`v1/`, `v2/`)**: All versions in their own namespace
- **Migration path**: `v1/` → `v2/` → `v3/` (linear progression)

### Entity Ownership Principle

**🚨 CRITICAL RULE**: Each entity module owns exactly ONE database table.

```typescript
// ❌ FORBIDDEN: Cross-entity operations
export async function updateMemberOrganization(memberId: string, orgData: any) {
  return qx.query('UPDATE organizations SET name = $1...', [orgData.name])
}

// ✅ CORRECT: Entity-specific operations only
export async function updateMember(qx: QueryExecutor, memberId: string, data: IUpdateMemberData) {
  return qx.query('UPDATE members SET display_name = $1...', [data.displayName])
}
```

For cross-entity operations, coordinate at the service layer.

### Core Components

- **`base.ts`** - CRUD operations (`create`, `update`, `findById`, `findMany`, `delete`)
- **`types.ts`** - TypeScript interfaces (`IDb[Entity]Data`, `I[Entity]CreateData`)
- **`constants.ts`** - Cache TTL, query limits, table names
- **`queryBuilder.ts`** - Dynamic SQL construction (optional)
- **`utils.ts`** - Entity helpers (discouraged, prefer shared `/utils/`)

### Entity Versioning Strategy

**When to Create a New Version:**
- Breaking changes to database schema
- Major API interface modifications
- Significant performance optimizations that change behavior
- Migration from legacy patterns (e.g., Sequelize → QueryExecutor)

**Version Management Rules:**
```typescript
// Root index.ts - Routes to latest version
export * from './v2'  // Current latest
export * as v1 from './v1'  // Legacy access
export * as v2 from './v2'  // Explicit access

// Specific version imports
import { findMemberById } from '@crowd/dal/members'     // Latest (v2)
import { findMemberById } from '@crowd/dal/members/v1'  // Explicit v1
import { findMemberById } from '@crowd/dal/members/v2'  // Explicit v2
```

**Backward Compatibility:**
- Keep old versions for 6+ months minimum
- Provide clear migration guides
- Log deprecation warnings in legacy versions
- Run both versions in parallel during transition

### Example Structure
```typescript
// src/members/v2/constants.ts (Current Version)
export const MEMBER_CONSTANTS = {
  CACHE: { TTL_SECONDS: 1800, KEY_PREFIX: 'member' },
  QUERY: { DEFAULT_LIMIT: 20, MAX_LIMIT: 1000 }
} as const

// src/members/v2/base.ts (Current Version)
export async function queryMembersAdvanced(
  qx: QueryExecutor,
  params: IQueryMembersAdvancedParams
): Promise<PageData<IDbMemberData>> {
  const cacheKey = `${MEMBER_CONSTANTS.CACHE.KEY_PREFIX}:advanced:${hash(params)}`
  // ... optimized implementation with QueryExecutor
}
```

### Versioning Example
```typescript
// src/members/index.ts (Version Router)
export * from './v2'  // Latest version (default exports)
export * as v1 from './v1'  // Legacy namespace
export * as v2 from './v2'  // Explicit namespace

// Version metadata
export const LATEST_VERSION = 'v2'
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const

// src/members/v2/index.ts (Current Version)
export { findMemberById, createMember, queryMembersAdvanced } from './base'
export type { IDbMemberData, ICreateMemberData } from './types'
export { MEMBER_CONSTANTS } from './constants'

// src/members/v2/base.ts (Current Implementation)
export async function findMemberById(
  qx: QueryExecutor,
  memberId: string
): Promise<IDbMemberData | null> {
  // Optimized implementation with QueryExecutor
  return qx.selectOneOrNone(
    'SELECT id, display_name, email FROM members WHERE id = $1', 
    [memberId]
  )
}

// src/members/v1/base.ts (Legacy Implementation)
/**
 * @deprecated Use v2 API instead. Will be removed in Q2 2025.
 */
export async function findMemberById(
  qx: QueryExecutor,
  memberId: string
): Promise<IDbMemberDataV1 | null> {
  console.warn('Members V1 API is deprecated. Migrate to V2 by Q1 2025.')
  // Legacy Sequelize-style implementation
  return qx.selectOneOrNone('SELECT * FROM members WHERE id = $1', [memberId])
}
```

**Usage Patterns:**
```typescript
// Option 1: Use latest (recommended)
import { findMemberById } from '@crowd/dal/members'
const member = await findMemberById(qx, id)

// Option 2: Explicit version (migration scenarios)
import { findMemberById } from '@crowd/dal/members/v2'
const member = await findMemberById(qx, id)

// Option 3: Legacy support (temporary)
import { v1 } from '@crowd/dal/members'
const member = await v1.findMemberById(qx, id)
```

**Real-World Migration Scenario:**
1. **V1**: Sequelize-based, full row SELECT, slower
2. **V2**: QueryExecutor-based, selective columns, optimized
3. **Services**: Gradually migrate from `v1` to default imports
4. **Cleanup**: Remove `v1/` folder after deprecation period

## Caching Strategy

**Stale-While-Revalidate (SWR) Pattern**
- Returns cached data immediately (if available)
- Refreshes cache in background for next request
- 30-minute default TTL with Redis backend

```typescript
// Usage
const cached = await cache.get(cacheKey)
if (cached) {
  void refreshCacheInBackground(params, cacheKey, cache, qx)
  return JSON.parse(cached)
}

const result = await executeQuery(params, qx)
await cache.set(cacheKey, JSON.stringify(result), TTL_SECONDS)
return result
```

## Logging Guidelines

**Log Levels**
- **ERROR**: Database failures, constraint violations
- **WARN**: Slow queries (>5s), cache misses  
- **INFO**: Cache refresh, bulk operations
- **DEBUG**: Query details, performance metrics

**What to Log**
- Operation context (method, entity, operation type)
- Performance data (execution time, record count)
- Sanitized queries (no sensitive data)

**Never Log**
- PII, credentials, raw query parameters
- Use `userId.substring(0, 8) + '...'` for references

## Violation Examples

Real violations found in the codebase that break architectural principles:

### Violation 1: Members Enrichment Worker Modifying Organizations Table

**Location:** `/services/libs/data-access-layer/src/old/apps/members_enrichment_worker/index.ts`

**❌ Problem Code:**
```typescript
// VIOLATION: members_enrichment_worker inserting into organizations table
export async function insertOrganization(
  tx: DbTransaction,
  /* Lines 122-124 omitted */
  location: string,
): Promise<string> {
  const id = generateUUIDv4()
  /* Lines 127-137 omitted */
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
  /* Lines 154-161 omitted */
  await linkMemberToOrganization(memberId, orgId)
}
```

**More violations exist** - see original codebase for full details.

### Violation 3: Organization Operations Outside Organizations Module

**Location:** `/services/libs/data-access-layer/src/old/apps/entity_merging_worker/orgs.ts`

**❌ Problem Code:**
```typescript
// VIOLATION: DELETE operation on organizations from non-organizations module
export async function deleteOrganizationById(db: DbStore, organizationId: string) {
  await db.connection().query(
    /* Lines 176-178 omitted */
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
  /* Lines 208-209 omitted */
  orgs: IOrganizationIdSource[],
): Promise<void> {
  const query = `
  /* Lines 212-216 omitted */
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

## Transaction Management

**Service Layer Transactions**
```typescript
// Service coordinates multiple entities
export async function createMemberWithOrganization(memberData: any, orgData: any) {
  return qx.tx(async (tx) => {
    const memberId = await updateMember(tx, memberData)
    const orgId = await createOrganization(tx, orgData)
    return { memberId, orgId }
  })
}
```

**Entity Functions Accept QueryExecutor**
```typescript
// All functions must accept QueryExecutor as first parameter
export async function updateMember(
  qx: QueryExecutor,
  memberId: string,
  data: IUpdateMemberData
): Promise<void> {
  await qx.result('UPDATE members SET...', data)
}
```

**Key Principles**
- Service layer manages transaction boundaries
- Entity functions are transaction-agnostic
- Automatic rollback on errors
- No manual commit/rollback

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

---

## 7. Documentation Standards

All data access functions must be thoroughly documented using TSDoc/JSDoc format. This ensures developers understand the function's purpose, parameters, return values, and potential side effects.

### Documentation Requirements

**All exported functions must include:**
- Clear description of functionality and business purpose
- Complete parameter documentation with types and constraints
- Return value structure and type information
- Possible exceptions and error conditions
- Practical usage examples
- Performance characteristics and caching behavior
- Transaction requirements

**Example:**
```typescript
/**
 * Retrieves members with advanced filtering capabilities.
 * 
 * @description Performs complex member queries with support for activity filtering,
 * organization relationships, and engagement metrics. Uses SWR caching pattern.
 * 
 * @param qx - Query executor (transaction-aware)
 * @param tenantId - Tenant identifier for data isolation
 * @param params - Query filters and pagination options
 * 
 * @returns Promise resolving to paginated member results
 * 
 * @throws {ValidationError} When parameters are invalid
 * @throws {DatabaseError} When query execution fails
 * 
 * @example
 * ```typescript
 * const members = await queryMembersAdvanced(qx, tenantId, {
 *   limit: 20,
 *   activityTypes: ['github_commit'],
 *   engagementScore: { min: 50 }
 * })
 * ```
 * 
 * @cache Redis SWR, 30min TTL
 * @performance ~500ms for complex queries
 */
```

### Custom Tags for Data Access Layer

The following custom JSDoc tags provide additional context specific to data access operations:

- `@cache` - Describes caching strategy and TTL configuration
- `@performance` - Notes about execution time and optimization characteristics
- `@transaction` - Indicates transaction requirements and behavior
- `@internal` - Marks functions for internal library use only
- `@entity` - Specifies which database entity this function operates on
- `@migration` - Notes about database migration requirements

**Example with custom tags:**
```typescript
/**
 * Creates a new member organization relationship.
 * 
 * @entity memberOrganizations
 * @transaction Required - must run within transaction context
 * @cache Invalidates member and organization caches
 * 
 * @param qx - Query executor (transaction required)
 * @param relationship - Relationship data to create
 */
export async function createMemberOrganizationRelationship(
  qx: QueryExecutor,
  relationship: ICreateMemberOrgRelationship,
): Promise<string> {
  // Implementation...
}
```

### Module-Level Documentation

Each entity module should include comprehensive file-level documentation:

```typescript
/**
 * @fileoverview Member entity data access operations.
 * 
 * This module provides comprehensive data access functions for member-related
 * database operations. All functions follow the single-entity responsibility
 * principle and operate exclusively on the 'members' table.
 * 
 * **Key Features:**
 * - CRUD operations with type safety
 * - Advanced querying with caching
 * - Transaction-aware operations
 * - Performance optimized queries
 * 
 * **Caching Strategy:**
 * Uses Redis-based stale-while-revalidate (SWR) pattern with 30-minute TTL.
 * Cache keys include tenant and parameter context for accuracy.
 * 
 * **Performance Notes:**
 * - Simple queries: <100ms
 * - Complex aggregations: <2000ms  
 * - Bulk operations: <5000ms for 1000 records
 * 
 * @example
 * ```typescript
 * import { findMemberById, updateMember } from '@crowd/data-access-layer/src/members'
 * 
 * const member = await findMemberById(qx, 'member-123')
 * await updateMember(qx, member.id, { lastActive: new Date() })
 * ```
 * 
 * @see {@link IDbMemberData} for member data structure
 * @see {@link MEMBER_CONSTANTS} for configuration constants
 * 
 * @module members
 * @version 2.1.0
 */
```

### Generating Documentation

Generate HTML documentation from TSDoc comments using TypeDoc:

```bash
# Install TypeDoc
npm install --save-dev typedoc typedoc-plugin-markdown

# Generate documentation
npm run docs:generate    # Generate HTML documentation
npm run docs:serve      # Serve documentation locally
npm run docs:validate   # Validate documentation completeness
```

**TypeDoc Configuration (typedoc.json):**
```json
{
  "entryPoints": ["src/*/index.ts"],
  "out": "docs",
  "theme": "default",
  "excludePrivate": true,
  "excludeInternal": false,
  "categoryOrder": [
    "Core Entities",
    "Relationships", 
    "Utilities",
    "*"
  ],
  "plugin": ["typedoc-plugin-markdown"]
}
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "docs:generate": "typedoc",
    "docs:serve": "http-server docs -p 8080",
    "docs:validate": "tsc --noEmit && typedoc --validation"
  }
}
```

### Documentation Quality Standards

**Required Documentation Quality Checks:**
- All public functions must have complete JSDoc documentation
- Examples must be executable and tested
- Performance annotations must include realistic timing expectations
- Cache behavior must be clearly documented
- Transaction requirements must be explicitly stated
- Error conditions must be comprehensively covered

**Documentation Review Process:**
1. **Automated Validation**: Use TypeDoc validation to ensure completeness
2. **Code Review**: Documentation quality is part of PR review criteria
3. **Example Testing**: All documentation examples must pass automated testing
4. **Performance Verification**: Stated performance characteristics must be validated through benchmarks

The generated documentation provides a comprehensive reference for all data access functions, making it easier for developers to understand and use the library effectively while maintaining high code quality and consistency across the platform.