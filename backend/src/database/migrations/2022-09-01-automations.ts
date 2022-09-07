import { QueryInterface } from 'sequelize/types'

export const up = async (queryInterface: QueryInterface, sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      'automations',
      {
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
      },
      { transaction },
    )
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
      { transaction },
    )
    await queryInterface.sequelize.query(
      'create index "automations_type_tenantId_trigger_state" on automations (type, "tenantId", trigger, state)',
      { transaction },
    )

    await queryInterface.createTable(
      'automationExecutions',
      {
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
      },
      { transaction },
    )

    await queryInterface.sequelize.query(
      'create index "automationExecutions_automationId" on "automationExecutions" ("automationId")',
      { transaction },
    )
    await queryInterface.addConstraint('automationExecutions', {
      type: 'foreign key',
      fields: ['tenantId'],
      name: 'automationExecutions_tenantId_fkey',
      references: {
        table: 'tenants',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      transaction,
    })
    await queryInterface.addConstraint('automationExecutions', {
      type: 'foreign key',
      fields: ['automationId'],
      name: 'automationExecutions_automationId_fkey',
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
    await queryInterface.dropTable('automationExecutions', { transaction })
    await queryInterface.dropTable('automations', { transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
