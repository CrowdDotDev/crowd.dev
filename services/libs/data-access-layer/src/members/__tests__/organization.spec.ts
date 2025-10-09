import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IMemberOrganization, IMemberOrganizationAffiliationOverride } from '@crowd/types'
import { QueryExecutor } from '../../queryExecutor'
import { mergeRoles, IMergeStrat, EntityField } from '../organizations'

// Mock QueryExecutor
const mockQueryExecutor = {
  select: vi.fn(),
  selectOneOrNone: vi.fn(),
  result: vi.fn(),
  tx: vi.fn(),
} as unknown as QueryExecutor

// Mock merge strategy
const mockMergeStrat: IMergeStrat = {
  entityIdField: EntityField.memberId,
  intersectBasedOnField: EntityField.organizationId,
  entityId: (role: IMemberOrganization) => role.memberId,
  intersectBasedOn: (role: IMemberOrganization) => role.organizationId,
  worthMerging: (a: IMemberOrganization, b: IMemberOrganization) => 
    a.organizationId === b.organizationId,
  targetMemberId: () => 'primary-member-id',
  targetOrganizationId: (role: IMemberOrganization) => role.organizationId,
}

describe('mergeRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock database functions
    mockQueryExecutor.select = vi.fn().mockResolvedValue([])
    mockQueryExecutor.selectOneOrNone = vi.fn().mockResolvedValue({ id: 'new-role-id' })
    mockQueryExecutor.result = vi.fn().mockResolvedValue({})
  })

  describe('when secondary role has no dates (generic role)', () => {
    it('should remove the secondary role', async () => {
      const primaryRoles: IMemberOrganization[] = [
        {
          id: 'primary-role-id',
          memberId: 'primary-member-id',
          organizationId: 'org-1',
          dateStart: null as any, // Type assertion needed because interface expects Date | string
          dateEnd: null as any,
          title: null,
          source: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }
      ]

      const secondaryRoles: IMemberOrganization[] = [
        {
          id: 'secondary-role-id',
          memberId: 'secondary-member-id',
          organizationId: 'org-1',
          dateStart: null as any,
          dateEnd: null as any,
          title: null,
          source: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }
      ]

      const primaryOverrides: IMemberOrganizationAffiliationOverride[] = []
      const secondaryOverrides: IMemberOrganizationAffiliationOverride[] = []

      await mergeRoles(
        mockQueryExecutor,
        primaryRoles,
        secondaryRoles,
        primaryOverrides,
        secondaryOverrides,
        mockMergeStrat
      )

      // Verify that removal function was called
      expect(mockQueryExecutor.select).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "memberOrganizations"'),
        expect.objectContaining({
          organizationId: 'org-1',
          memberId: 'secondary-member-id',
        })
      )
    })
  })

  describe('when secondary role is current (dateEnd is null)', () => {
    it('should add role when no current role exists in primary', async () => {
      const primaryRoles: IMemberOrganization[] = []

      const secondaryRoles: IMemberOrganization[] = [
        {
          id: 'secondary-role-id',
          memberId: 'secondary-member-id',
          organizationId: 'org-1',
          dateStart: '2013-05-01T00:00:00.000Z',
          dateEnd: null as any,
          title: 'Board Member',
          source: 'ui',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }
      ]

      const primaryOverrides: IMemberOrganizationAffiliationOverride[] = []
      const secondaryOverrides: IMemberOrganizationAffiliationOverride[] = []

      await mergeRoles(
        mockQueryExecutor,
        primaryRoles,
        secondaryRoles,
        primaryOverrides,
        secondaryOverrides,
        mockMergeStrat
      )

      // Verify that add function was called
      expect(mockQueryExecutor.selectOneOrNone).toHaveBeenCalledWith(
        expect.stringContaining('insert into "memberOrganizations"'),
        expect.objectContaining({
          memberId: 'secondary-member-id',
          organizationId: 'org-1',
          title: 'Board Member',
          dateStart: '2013-05-01T00:00:00.000Z',
          dateEnd: null,
          source: 'ui',
        })
      )
    })

    it('should handle case with your specific input data', async () => {
      const primaryRoles: IMemberOrganization[] = [
        {
          createdAt: '2025-09-26T03:44:11.203Z',
          updatedAt: '2025-09-26T03:44:11.203Z',
          memberId: '39f37012-bba5-4b8c-ad5e-7ebc9d7b7643',
          organizationId: 'e13ebd70-6656-11ee-a708-3d073672a0da',
          dateStart: null as any, // This is why currentRoles will be empty
          dateEnd: null as any,
          title: null,
          id: '65c3e706-c9aa-42e7-994d-55dfea738eb2',
          source: null,
          deletedAt: null,
        }
      ]

      const secondaryRoles: IMemberOrganization[] = [
        {
          createdAt: '2025-06-15T13:11:50.242Z',
          updatedAt: '2025-09-25T06:11:45.177Z',
          memberId: '4c6a3891-49ea-11f0-98a0-f74bb71b0c2c',
          organizationId: 'e13ebd70-6656-11ee-a708-3d073672a0da',
          dateStart: '2013-05-01T00:00:00.000Z', // This is a current role
          dateEnd: null as any,
          title: 'Board Member',
          id: 'bdec4301-ecbc-4dd7-ae3d-1aa276e41603',
          source: 'ui',
          deletedAt: null,
        }
      ]

      const primaryOverrides: IMemberOrganizationAffiliationOverride[] = []
      const secondaryOverrides: IMemberOrganizationAffiliationOverride[] = []

      // Mock mergeStrat for this specific case
      const specificMergeStrat: IMergeStrat = {
        ...mockMergeStrat,
        worthMerging: (a: IMemberOrganization, b: IMemberOrganization) => 
          a.organizationId === b.organizationId,
        targetMemberId: (role: IMemberOrganization) => role.memberId,
      }

      await mergeRoles(
        mockQueryExecutor,
        primaryRoles,
        secondaryRoles,
        primaryOverrides,
        secondaryOverrides,
        specificMergeStrat
      )

      // The secondary role should be added because no current roles match the filter
      // mo.dateStart !== null && mo.dateEnd === null in primaryRoles
      expect(mockQueryExecutor.selectOneOrNone).toHaveBeenCalledWith(
        expect.stringContaining('insert into "memberOrganizations"'),
        expect.objectContaining({
          memberId: '4c6a3891-49ea-11f0-98a0-f74bb71b0c2c',
          organizationId: 'e13ebd70-6656-11ee-a708-3d073672a0da',
          title: 'Board Member',
          dateStart: '2013-05-01T00:00:00.000Z',
        })
      )

      // The secondary role should also be removed from its original member
      expect(mockQueryExecutor.select).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "memberOrganizations"'),
        expect.objectContaining({
          organizationId: 'e13ebd70-6656-11ee-a708-3d073672a0da',
          memberId: '4c6a3891-49ea-11f0-98a0-f74bb71b0c2c',
        })
      )
    })
  })

  describe('debugging your specific case', () => {
    it('should explain why removeRoles is empty in your scenario', async () => {
      const primaryRoles: IMemberOrganization[] = [
        {
          memberId: '39f37012-bba5-4b8c-ad5e-7ebc9d7b7643',
          organizationId: 'e13ebd70-6656-11ee-a708-3d073672a0da',
          dateStart: null as any,  // ❌ This fails the filter: mo.dateStart !== null
          dateEnd: null as any,
          title: null,
          id: '65c3e706-c9aa-42e7-994d-55dfea738eb2',
          source: null,
          deletedAt: null,
        }
      ]

      const secondaryRoles: IMemberOrganization[] = [
        {
          memberId: '4c6a3891-49ea-11f0-98a0-f74bb71b0c2c',
          organizationId: 'e13ebd70-6656-11ee-a708-3d073672a0da',
          dateStart: '2013-05-01T00:00:00.000Z', // ✅ This passes: dateStart !== null && dateEnd === null
          dateEnd: null as any,
          title: 'Board Member',
          id: 'bdec4301-ecbc-4dd7-ae3d-1aa276e41603',
          source: 'ui',
          deletedAt: null,
        }
      ]

      const primaryOverrides: IMemberOrganizationAffiliationOverride[] = []
      const secondaryOverrides: IMemberOrganizationAffiliationOverride[] = []

      const specificMergeStrat: IMergeStrat = {
        ...mockMergeStrat,
        worthMerging: (a: IMemberOrganization, b: IMemberOrganization) => 
          a.organizationId === b.organizationId,
      }

      await mergeRoles(
        mockQueryExecutor,
        primaryRoles,
        secondaryRoles,
        primaryOverrides,
        secondaryOverrides,
        specificMergeStrat
      )

      // Why removeRoles is empty in your case:
      // 1. secondaryRole is current (dateStart !== null && dateEnd === null)
      // 2. primaryRoles.filter() with (mo.dateStart !== null && mo.dateEnd === null) 
      //    returns empty array because primaryRole has dateStart: null
      // 3. Since currentRoles.length === 0, the role goes to addRoles instead of removeRoles
      // 4. The role IS removed from secondary member (line ~652) but this happens after
      //    the arrays are reset to [] at the end of the function

      expect(mockQueryExecutor.selectOneOrNone).toHaveBeenCalled() // Role added
      expect(mockQueryExecutor.select).toHaveBeenCalled() // Role removed from secondary
    })
  })
})