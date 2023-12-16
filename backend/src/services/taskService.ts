import { Error400 } from '@crowd/common'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import TaskRepository from '../database/repositories/taskRepository'
import MemberRepository from '../database/repositories/memberRepository'
import UserRepository from '../database/repositories/userRepository'

export default class TaskService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      const record = await TaskRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'task')

      throw error
    }
  }

  /**
   * Assign a task to a user
   * @param id Id of the task to assign
   * @param userId Id of the user to assign the task to. Send null for unassigning the task.
   */
  async assignTo(id: string, userIds: string[]) {
    if (userIds === null || userIds === undefined) {
      userIds = []
    }
    const users = await UserRepository.filterIdsInTenant(userIds, this.options)
    return this.update(id, {
      assignees: users,
    })
  }

  /**
   * Assign a task to a user by email
   * @param id Id of the task to assign
   * @param email Email of the user to assign the task to.
   */
  async assignToByEmail(id, email) {
    let userIds
    if (email === null || email === undefined) {
      userIds = []
    } else {
      userIds = [(await UserRepository.findByEmail(email, this.options)).id]
    }

    return this.update(id, {
      assignees: userIds,
    })
  }

  /**
   * Update status of a task
   * @param id Id of the task to update
   * @param status New status of the task
   */
  async updateStatus(id, status) {
    if (status === null || status === undefined) {
      status = null
    }
    return this.update(id, {
      status,
    })
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      const record = await TaskRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'task')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await TaskRepository.destroy(
          id,
          {
            ...this.options,
            transaction,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return TaskRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return TaskRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndUpdateAll(args) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const tasks = await TaskRepository.findAndCountAll({ filter: args.filter }, this.options)
      const bulkResult = await TaskRepository.updateBulk(
        tasks.rows.map((i) => i.id),
        args.update,
        { ...this.options, transaction },
      )
      await SequelizeRepository.commitTransaction(transaction)
      return bulkResult
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findAndDeleteAll(args) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const tasks = await TaskRepository.findAndCountAll({ filter: args.filter }, this.options)

      for (const task of tasks.rows) {
        await TaskRepository.destroy(task.id, this.options, true)
      }
      await SequelizeRepository.commitTransaction(transaction)
      return { rowsDeleted: tasks.count }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findAndCountAll(args) {
    return TaskRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return TaskRepository.findAndCountAll({ advancedFilter, orderBy, limit, offset }, this.options)
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.create(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await TaskRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }
}
