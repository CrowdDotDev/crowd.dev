import { QueryInterface } from 'sequelize/types'

export const up = async (queryInterface: QueryInterface, sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable('automations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: sequelize.UUID,
      },
      type: {
        allowNull: false,
        type: sequelize.STRING(80),
        validate: {
          notEmpty: true,
        },
      },
      tenantId: {
        allowNull: false,
        type: sequelize.UUID,
      },
      trigger: {
        allowNull: false,
        type: sequelize.STRING(80),
        validate: {
          notEmpty: true,
        },
      },
      settings: {
        allowNull: false,
        type: sequelize.JSONB,
      },
      state: {
        allowNull: false,
        type: sequelize.STRING(80),
        validate: {
          notEmpty: true,
        },
      },

      // metadata
      createdAt: {
        allowNull: false,
        type: sequelize.DATE,
      },

      createdById: {
        allowNull: false,
        type: sequelize.UUID,
      },

      updatedAt: {
        allowNull: false,
        type: sequelize.DATE,
      },
      updatedById: {
        type: sequelize.UUID,
      },

      deletedAt: {
        type: sequelize.DATE,
        allowNull: true,
      },
      deletedById: {
        type: sequelize.UUID,
      },
    })
    await queryInterface.addConstraint('automations', {
      type: 'foreign key',
      fields: ['tenantId'],
      name: 'automations_tenantId_fkey',
      references: {
        table: 'tenants',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      transaction,
    })
    await queryInterface.addConstraint('automations', {
      type: 'foreign key',
      fields: ['createdById'],
      name: 'automations_createdById_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      transaction,
    })
    await queryInterface.addConstraint('automations', {
      type: 'foreign key',
      fields: ['updatedById'],
      name: 'automations_updatedById_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      transaction,
    })

    await queryInterface.sequelize.query(
      'create index "automations_tenantId" on automations ("tenantId")',
    )
    await queryInterface.sequelize.query(
      'create index "automations_type_tenantId_trigger_state" on automations (type, "tenantId", trigger, state)',
    )

    await queryInterface.createTable('automationExecutionHistories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: sequelize.UUID,
      },
      automationId: {
        allowNull: false,
        type: sequelize.UUID,
      },
      type: {
        allowNull: false,
        type: sequelize.STRING(80),
        validate: {
          notEmpty: true,
        },
      },
      tenantId: {
        allowNull: false,
        type: sequelize.UUID,
      },
      trigger: {
        allowNull: false,
        type: sequelize.STRING(80),
        validate: {
          notEmpty: true,
        },
      },
      state: {
        allowNull: false,
        type: sequelize.STRING(80),
        validate: {
          notEmpty: true,
        },
      },
      error: {
        allowNull: true,
        type: sequelize.JSON,
      },
      executedAt: {
        type: sequelize.DATE,
        allowNull: false,
      },
      eventId: {
        type: sequelize.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      payload: {
        type: sequelize.JSON,
        allowNull: false,
      },
    })

    await queryInterface.sequelize.query(
      'create index "automationExecutionHistories_automationId" on "automationExecutionHistories" ("automationId")',
    )
    await queryInterface.addConstraint('automationExecutionHistories', {
      type: 'foreign key',
      fields: ['tenantId'],
      name: 'automationExecutionHistories_tenantId_fkey',
      references: {
        table: 'tenants',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      transaction,
    })
    await queryInterface.addConstraint('automationExecutionHistories', {
      type: 'foreign key',
      fields: ['automationId'],
      name: 'automationExecutionHistories_automationId_fkey',
      references: {
        table: 'automations',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface: QueryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.sequelize.query('drop index "automationExecutionHistories_automationId"')
    await queryInterface.removeConstraint(
      'automationExecutionHistories',
      'automationExecutionHistories_tenantId_fkey',
    )
    await queryInterface.removeConstraint(
      'automationExecutionHistories',
      'automationExecutionHistories_automationId_fkey',
    )
    await queryInterface.dropTable('automationExecutionHistories')
    await queryInterface.sequelize.query('drop index "automations_tenantId"')
    await queryInterface.sequelize.query('drop index "automations_type_tenantId_trigger_state"')
    await queryInterface.removeConstraint('automations', 'automations_deletedById_fkey')
    await queryInterface.removeConstraint('automations', 'automations_updatedById_fkey')
    await queryInterface.removeConstraint('automations', 'automations_createdById_fkey')
    await queryInterface.removeConstraint('automations', 'automations_tenantId_fkey')
    await queryInterface.dropTable('automations')
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
