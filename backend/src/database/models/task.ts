import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const task = sequelize.define(
    'task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
      },
      type: {
        type: DataTypes.STRING(255),
        validate: {
          isIn: [['regular', 'suggested']],
        },
        defaultValue: 'regular',
      },
      status: {
        type: DataTypes.STRING(255),
        validate: {
          isIn: [['in-progress', 'done', 'archived']],
        },
        defaultValue: 'in-progress',
      },
      dueDate: {
        type: DataTypes.DATE,
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['importHash', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          fields: ['name', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  task.associate = (models) => {
    models.task.belongsToMany(models.member, {
      as: 'members',
      through: 'memberTasks',
      foreignKey: 'taskId',
    })

    models.task.belongsToMany(models.activity, {
      as: 'activities',
      through: 'activityTasks',
      foreignKey: 'taskId',
    })

    models.task.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.task.belongsTo(models.segment, {
      as: 'segment',
      foreignKey: {
        allowNull: false,
      },
    })

    models.task.belongsToMany(models.user, {
      as: 'assignees',
      through: 'taskAssignees',
      foreignKey: 'taskId',
    })

    models.task.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.task.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return task
}
