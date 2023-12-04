import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const activity = sequelize.define(
    'activity',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      platform: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      isContribution: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
      },
      sourceId: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      sourceParentId: {
        type: DataTypes.STRING(255),
      },
      username: {
        type: DataTypes.TEXT,
      },
      objectMemberUsername: {
        type: DataTypes.TEXT,
      },
      attributes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      channel: {
        type: DataTypes.TEXT,
      },
      body: {
        type: DataTypes.TEXT,
      },
      title: {
        type: DataTypes.TEXT,
      },
      url: {
        type: DataTypes.TEXT,
      },
      sentiment: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
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
          fields: ['platform', 'tenantId', 'type', 'timestamp'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['timestamp', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          fields: ['sourceId', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['memberId', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['sourceParentId', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['deletedAt'],
        },
        {
          unique: false,
          fields: ['parentId', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['conversationId', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  activity.associate = (models) => {
    models.activity.belongsTo(models.member, {
      as: 'member',
      onDelete: 'cascade',
      foreignKey: {
        allowNull: false,
      },
    })

    models.activity.belongsTo(models.segment, {
      as: 'segment',
      foreignKey: {
        allowNull: false,
      },
    })

    models.activity.belongsTo(models.member, {
      as: 'objectMember',
    })

    models.activity.belongsTo(models.conversation, {
      as: 'conversation',
    })

    models.activity.belongsTo(models.activity, {
      as: 'parent',
      // constraints: false,
    })

    models.activity.belongsToMany(models.task, {
      as: 'tasks',
      through: 'activityTasks',
    })

    models.activity.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.activity.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.activity.belongsTo(models.user, {
      as: 'updatedBy',
    })

    models.activity.belongsTo(models.organization, {
      as: 'organization',
    })
  }

  return activity
}
