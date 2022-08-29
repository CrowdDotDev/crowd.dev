import Sequelize, { DataTypes } from 'sequelize'

export default (sequelize) => {
  const member = sequelize.define(
    'member',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          isIn: [['member', 'lookalike']],
        },
        defaultValue: 'member',
      },
      info: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      crowdInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      email: {
        type: DataTypes.TEXT,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: -1,
      },
      bio: {
        type: DataTypes.TEXT,
      },
      organisation: {
        type: DataTypes.TEXT,
      },
      location: {
        type: DataTypes.TEXT,
      },
      signals: {
        type: DataTypes.TEXT,
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
          unique: false,
          fields: ['email', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        // Using GIN index so we can index every single platform
        // in the JSONB field
        {
          unique: false,
          fields: ['username'],
          using: 'gin',
          operator: 'jsonb_path_ops',
        },
        // Below are B-tree indexes for speeding up search in normal fields
        {
          unique: false,
          fields: ['organisation', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['location', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['type', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
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
        {
          unique: false,
          fields: ['signals', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          name: 'slack',
          fields: [Sequelize.literal('(("username"->>\'slack\')::text)')],
        },
        {
          name: 'github',
          fields: [Sequelize.literal('(("username"->>\'github\')::text)')],
        },
        {
          name: 'twitter',
          fields: [Sequelize.literal('(("username"->>\'twitter\')::text)')],
        },
        {
          name: 'discord',
          fields: [Sequelize.literal('(("username"->>\'discord\')::text)')],
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  member.associate = (models) => {
    models.member.hasMany(models.activity, {
      as: 'activities',
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
  }

  return member
}
