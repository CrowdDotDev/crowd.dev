import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const member = sequelize.define(
    'member',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      displayName: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      emails: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: -1,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      reach: {
        type: DataTypes.JSONB,
        defaultValue: {
          total: -1,
        },
      },
      contributions: {
        type: DataTypes.JSONB,
      },
      lastEnriched: {
        type: DataTypes.DATE,
      },
      enrichedBy: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
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
        // Below are B-tree indexes for speeding up search in normal fields
        {
          unique: false,
          fields: ['score', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['joinedAt', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['createdAt', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  member.associate = (models) => {
    models.member.hasMany(models.memberIdentity, {
      as: 'memberIdentities',
      foreignKey: 'memberId',
    })

    models.member.belongsToMany(models.segment, {
      as: 'segments',
      through: 'memberSegments',
      timestamps: false,
    })

    models.member.hasOne(models.memberActivityAggregatesMV, {
      as: 'memberActivityAggregatesMVs',
      foreignKey: 'id',
    })

    models.member.hasMany(models.activity, {
      as: 'activities',
    })

    models.member.belongsToMany(models.note, {
      as: 'notes',
      through: 'memberNotes',
    })

    models.member.belongsToMany(models.task, {
      as: 'tasks',
      through: 'memberTasks',
    })

    models.member.belongsToMany(models.tag, {
      as: 'tags',
      through: 'memberTags',
    })

    models.member.belongsToMany(models.member, {
      as: 'noMerge',
      through: 'memberNoMerge',
    })

    models.member.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.member.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.member.belongsTo(models.user, {
      as: 'updatedBy',
    })

    models.member.belongsToMany(models.member, {
      as: 'toMerge',
      through: 'memberToMerge',
    })

    models.member.belongsToMany(models.organization, {
      as: 'organizations',
      through: 'memberOrganizations',
    })
  }

  return member
}
