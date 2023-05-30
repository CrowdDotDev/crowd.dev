import { randomUUID } from 'crypto'

import MemberRepository from '../memberRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import { PlatformType } from '@crowd/types'
import MemberEnrichmentCacheRepository from '../memberEnrichmentCacheRepository'
import { generateUUIDv1 } from '@crowd/common'

const db = null

describe('MemberEnrichmentCacheRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('upsert method', () => {
    it('Should create non existing item successfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'michael_scott',
          },
        },
        displayName: 'Member 1',
        email: 'michael@dd.com',
        score: 10,
        attributes: {},
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member = await MemberRepository.create(member2add, mockIRepositoryOptions)

      const enrichmentData = {
        enrichmentField1: 'string',
        enrichmentField2: 24,
        arrayEnrichmentField: [1, 2, 3],
      }

      const cache = await MemberEnrichmentCacheRepository.upsert(
        member.id,
        enrichmentData,
        mockIRepositoryOptions,
      )

      expect(cache.memberId).toEqual(member.id)
      expect(cache.data).toStrictEqual(enrichmentData)
    })

    it('Should update the data of existing cache item with incoming data', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'michael_scott',
          },
        },
        displayName: 'Member 1',
        email: 'michael@dd.com',
        score: 10,
        attributes: {},
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member = await MemberRepository.create(member2add, mockIRepositoryOptions)

      const enrichmentData = {
        enrichmentField1: 'string',
        enrichmentField2: 24,
        arrayEnrichmentField: [1, 2, 3],
      }

      let cache = await MemberEnrichmentCacheRepository.upsert(
        member.id,
        enrichmentData,
        mockIRepositoryOptions,
      )

      const newerEnrichmentData = {
        enrichmentField1: 'anotherString',
        enrichmentField2: 99,
        arrayEnrichmentField: ['a', 'b', 'c'],
      }

      // should overwrite with new cache data
      cache = await MemberEnrichmentCacheRepository.upsert(
        member.id,
        newerEnrichmentData,
        mockIRepositoryOptions,
      )

      expect(cache.memberId).toEqual(member.id)
      expect(cache.data).toStrictEqual(newerEnrichmentData)

      // when we send an empty object, it shouldn't overwrite
      cache = await MemberEnrichmentCacheRepository.upsert(member.id, {}, mockIRepositoryOptions)

      expect(cache.memberId).toEqual(member.id)
      expect(cache.data).toStrictEqual(newerEnrichmentData)
    })
  })

  describe('findByMemberId method', () => {
    it('Should find enrichment cache by memberId', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'michael_scott',
          },
        },
        displayName: 'Member 1',
        email: 'michael@dd.com',
        score: 10,
        attributes: {},
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member = await MemberRepository.create(member2add, mockIRepositoryOptions)

      const enrichmentData = {
        enrichmentField1: 'string',
        enrichmentField2: 24,
        arrayEnrichmentField: [1, 2, 3],
      }

      await MemberEnrichmentCacheRepository.upsert(
        member.id,
        enrichmentData,
        mockIRepositoryOptions,
      )

      const cache = await MemberEnrichmentCacheRepository.findByMemberId(
        member.id,
        mockIRepositoryOptions,
      )

      expect(cache.memberId).toEqual(member.id)
      expect(cache.data).toEqual(enrichmentData)
    })

    it('Should return null for non-existing cache entry', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const cache = await MemberEnrichmentCacheRepository.findByMemberId(
        randomUUID(),
        mockIRepositoryOptions,
      )
      expect(cache).toBeNull()
    })
  })
})
