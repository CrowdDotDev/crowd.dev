import { PlatformType } from '@crowd/types'
import merge from '../merge'

describe('Merge helper tests', () => {
  describe('merge method idendity', () => {
    it('Given a merge of 2 equal members, should return {}', async () => {
      const member1 = {
        id: '1',
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: 'Anil',
      }

      const merged = merge(member1, member1)

      expect(merged).toStrictEqual({})
    })
    it('Given a merge of 2 booleans, should return the new one', async () => {
      const member1 = {
        id: '1',
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: 'Anil',
        test: true,
      }
      const member2 = {
        id: '1',
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: 'Anil',
        test: false,
      }

      const merged = merge(member1, member2)

      expect(merged).toStrictEqual({ test: false })
    })
  })
  describe('merge method with special values', () => {
    it('Should pick the earliest date and leave them unchanged', async () => {
      const member1 = {
        id: '1',
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: 'Anil',
      }

      const member2 = {
        id: '1',
        joinedAt: new Date('2020-07-28T15:13:30Z'),
        username: 'Anil',
      }

      const merged = merge(member1, member2, {
        joinedAt: (oldDate, newDate) => new Date(Math.min(newDate, oldDate)),
      })

      expect(merged).toStrictEqual({})
    })

    it('Should pick the earliest date, updating', async () => {
      const member1 = {
        id: '1',
        joinedAt: new Date('2020-08-28T15:13:30Z'),
        username: 'Anil',
      }
      const member2 = {
        id: '1',
        joinedAt: new Date('2020-07-28T15:13:30Z'),
        username: 'Anil',
      }

      const merged = merge(member1, member2, {
        joinedAt: (oldDate, newDate) => new Date(Math.min(newDate, oldDate)),
      })

      expect(merged).toStrictEqual({
        joinedAt: new Date('2020-07-28T15:13:30Z'),
      })
    })

    it('Should pick the earliest nested date, updating', async () => {
      const member1 = {
        id: '1',
        dates: {
          joinedAt: new Date('2020-08-28T15:13:30Z'),
        },
        username: 'Anil',
      }
      const member2 = {
        id: '1',
        dates: {
          joinedAt: new Date('2020-07-28T15:13:30Z'),
        },
        username: 'Anil',
      }
      const merged = merge(member1, member2, {
        'dates.joinedAt': (oldDate, newDate) => new Date(Math.min(newDate, oldDate)),
      })
      expect(merged).toStrictEqual({
        dates: {
          joinedAt: new Date('2020-07-28T15:13:30Z'),
        },
      })
    })

    it('Should leave displayName the same when updating with a different', async () => {
      const member1 = {
        id: '1',
        displayName: 'Anil',
      }
      const member2 = {
        id: '1',
        displayName: 'Anil2',
      }
      const merged = merge(member1, member2, {
        displayName: (oldUsername) => oldUsername,
      })
      expect(merged).toStrictEqual({})
    })
  })

  describe('merge with lists', () => {
    it('Should leave the list unchanged', async () => {
      const member1 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil', 'Anil2'],
      }

      const member2 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil', 'Anil2'],
      }

      const merged = merge(member1, member2)
      expect(merged).toStrictEqual({})
    })

    it('Should add the things from the second list to the first', async () => {
      const member1 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil', 'Anil2'],
      }

      const member2 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil3', 'Anil4'],
      }

      const merged = merge(member1, member2)
      expect(merged).toStrictEqual({
        noMerge: ['Anil', 'Anil2', 'Anil3', 'Anil4'],
      })
    })

    it('Should merge the lists without duplicates', async () => {
      const member1 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil', 'Anil2'],
      }

      const member2 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil2', 'Anil4'],
      }

      const merged = merge(member1, member2)
      expect(merged).toStrictEqual({
        noMerge: ['Anil', 'Anil2', 'Anil4'],
      })
    })
    it('Should work when one list is empty', async () => {
      const member1 = {
        id: '1',
        username: 'Joan',
        noMerge: [],
      }

      const member2 = {
        id: '1',
        username: 'Joan',
        noMerge: ['Anil3', 'Anil4'],
      }

      const merged = merge(member1, member2)
      expect(merged).toStrictEqual({
        noMerge: ['Anil3', 'Anil4'],
      })
    })
  })

  describe('merge method with nulls', () => {
    it('Should leave fields unchanged when sending nulls in new', async () => {
      const original = {
        id: '1',
        info: {
          [PlatformType.GITHUB]: {
            username: 'Anil',
            url: 'github.com/anil',
            something: {
              nested: 'nested',
              more: 'more',
            },
          },
          [PlatformType.DISCORD]: {
            username: 'Anil42',
          },
        },
      }
      const newObject = {
        id: '1',
        info: {
          [PlatformType.GITHUB]: {
            username: null,
            url: 'github.com/anil',
            something: {
              nested: null,
              more: 'more',
            },
          },
          [PlatformType.DISCORD]: {
            username: null,
          },
        },
      }

      const merged = merge(original, newObject)
      expect(merged).toStrictEqual({})
    })

    it('Should leave fields unchanged that match nulls, but update new fields', async () => {
      const original = {
        id: '1',
        info: {
          [PlatformType.GITHUB]: {
            username: 'Anil',
            url: 'github.com/anil',
            something: {
              nested: 'nested',
              more: 'more',
            },
          },
          [PlatformType.DISCORD]: {
            username: 'Anil42',
          },
        },
      }
      const newObject = {
        id: '1',
        info: {
          [PlatformType.GITHUB]: {
            username: null,
            url: 'github.com/anil42',
            something: {
              nested: null,
              more: 'more',
            },
          },
          [PlatformType.DISCORD]: {
            username: null,
            url: 'discord.com/anil42',
          },
          newField: 'newField',
        },
      }

      const merged = merge(original, newObject)
      expect(merged).toStrictEqual({
        info: {
          [PlatformType.GITHUB]: {
            username: 'Anil',
            url: 'github.com/anil42',
            something: {
              nested: 'nested',
              more: 'more',
            },
          },
          [PlatformType.DISCORD]: {
            username: 'Anil42',
            url: 'discord.com/anil42',
          },
          newField: 'newField',
        },
      })
    })
  })
})
