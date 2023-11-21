import { PlatformType } from '@crowd/types'
import { Error404 } from '@crowd/common'
import NoteRepository from '../noteRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import MemberRepository from '../memberRepository'

const db = null

describe('NoteRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create the given note succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note2add = { body: 'test-note' }

      const noteCreated = await NoteRepository.create(note2add, mockIRepositoryOptions)

      noteCreated.createdAt = noteCreated.createdAt.toISOString().split('T')[0]
      noteCreated.updatedAt = noteCreated.updatedAt.toISOString().split('T')[0]

      const plainUser = mockIRepositoryOptions.currentUser.get({ plain: true })
      const expectedCreatedBy = {
        id: plainUser.id,
        fullName: plainUser.fullName,
        avatarUrl: null,
      }

      const expectedNoteCreated = {
        id: noteCreated.id,
        body: note2add.body,
        members: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdBy: expectedCreatedBy,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(noteCreated).toStrictEqual(expectedNoteCreated)
    })

    it('Should throw sequelize not null error -- body field is required', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note2add = {}

      await expect(() => NoteRepository.create(note2add, mockIRepositoryOptions)).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created note by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note2add = { body: 'test-note' }

      const noteCreated = await NoteRepository.create(note2add, mockIRepositoryOptions)

      noteCreated.createdAt = noteCreated.createdAt.toISOString().split('T')[0]
      noteCreated.updatedAt = noteCreated.updatedAt.toISOString().split('T')[0]

      const plainUser = mockIRepositoryOptions.currentUser.get({ plain: true })
      const expectedCreatedBy = {
        id: plainUser.id,
        fullName: plainUser.fullName,
        avatarUrl: null,
      }

      const expectedNoteFound = {
        id: noteCreated.id,
        body: note2add.body,
        members: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdBy: expectedCreatedBy,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      const noteById = await NoteRepository.findById(noteCreated.id, mockIRepositoryOptions)

      noteById.createdAt = noteById.createdAt.toISOString().split('T')[0]
      noteById.updatedAt = noteById.updatedAt.toISOString().split('T')[0]

      expect(noteById).toStrictEqual(expectedNoteFound)
    })

    it('Should throw 404 error when no note found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        NoteRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created note entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note1 = { body: 'test1' }
      const note2 = { body: 'test2' }

      const note1Created = await NoteRepository.create(note1, mockIRepositoryOptions)
      const note2Created = await NoteRepository.create(note2, mockIRepositoryOptions)

      const filterIdsReturned = await NoteRepository.filterIdsInTenant(
        [note1Created.id, note2Created.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([note1Created.id, note2Created.id])
    })

    it('Should only return the ids of previously created notes and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note = { body: 'test1' }

      const noteCreated = await NoteRepository.create(note, mockIRepositoryOptions)

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await NoteRepository.filterIdsInTenant(
        [noteCreated.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([noteCreated.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note = { body: 'test' }

      const noteCreated = await NoteRepository.create(note, mockIRepositoryOptions)

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await NoteRepository.filterIdsInTenant(
        [noteCreated.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('findAndCountAll method', () => {
    it('Should find and count all notes, with various filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const note1 = { body: 'test-note', members: [member.id] }
      const note2 = { body: 'test-note-2', members: [member.id] }
      const note3 = { body: 'another-note', members: [member.id] }

      const note1Created = await NoteRepository.create(note1, mockIRepositoryOptions)
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const note2Created = await NoteRepository.create(note2, mockIRepositoryOptions)
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const note3Created = await NoteRepository.create(note3, mockIRepositoryOptions)

      // Test filter by body
      // Current findAndCountAll uses wildcarded like statement so it matches both notes
      let notes = await NoteRepository.findAndCountAll(
        { filter: { body: 'test-note' } },
        mockIRepositoryOptions,
      )

      expect(notes.count).toEqual(2)
      expect(notes.rows).toStrictEqual([note2Created, note1Created])

      // Test filter by id
      notes = await NoteRepository.findAndCountAll(
        { filter: { id: note1Created.id } },
        mockIRepositoryOptions,
      )

      expect(notes.count).toEqual(1)
      expect(notes.rows).toStrictEqual([note1Created])

      // Test filter by createdAt - find all between note1.createdAt and note3.createdAt
      notes = await NoteRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [note1Created.createdAt, note3Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )

      expect(notes.count).toEqual(3)
      expect(notes.rows).toStrictEqual([note3Created, note2Created, note1Created])

      // Test filter by createdAt - find all where createdAt < note2.createdAt
      notes = await NoteRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, note2Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(notes.count).toEqual(2)
      expect(notes.rows).toStrictEqual([note2Created, note1Created])

      // Test filter by createdAt - find all where createdAt < note1.createdAt
      notes = await NoteRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, note1Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(notes.count).toEqual(1)
      expect(notes.rows).toStrictEqual([note1Created])
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created note', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note1 = { body: 'test-note' }

      const noteCreated = await NoteRepository.create(note1, mockIRepositoryOptions)

      const noteUpdated = await NoteRepository.update(
        noteCreated.id,
        { body: 'updated-note-body' },
        mockIRepositoryOptions,
      )

      expect(noteUpdated.updatedAt.getTime()).toBeGreaterThan(noteUpdated.createdAt.getTime())

      const plainUser = mockIRepositoryOptions.currentUser.get({ plain: true })
      const expectedCreatedBy = {
        id: plainUser.id,
        fullName: plainUser.fullName,
        avatarUrl: null,
      }

      const noteExpected = {
        id: noteCreated.id,
        body: noteUpdated.body,
        importHash: null,
        createdAt: noteCreated.createdAt,
        updatedAt: noteUpdated.updatedAt,
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdBy: expectedCreatedBy,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        members: [],
      }

      expect(noteUpdated).toStrictEqual(noteExpected)
    })

    it('Should throw 404 error when trying to update non existent note', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        NoteRepository.update(randomUUID(), { body: 'non-existent' }, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created note', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const note = { body: 'test-note' }

      const returnedNote = await NoteRepository.create(note, mockIRepositoryOptions)

      await NoteRepository.destroy(returnedNote.id, mockIRepositoryOptions, true)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        NoteRepository.findById(returnedNote.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent note', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        NoteRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
