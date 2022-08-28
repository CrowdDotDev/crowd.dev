import Sequelize, { DataTypes } from 'sequelize'

export default (sequelize) => {
  const communityMember = sequelize.define(
    'communityMember',
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

  communityMember.associate = (models) => {
    models.communityMember.hasMany(models.activity, {
      as: 'activities',
    })

    models.communityMember.belongsToMany(models.tag, {
      as: 'tags',
      through: 'communityMemberTags',
    })

    models.communityMember.belongsToMany(models.organization, {
      as: 'organizations',
      through: 'communityMemberOrganizations',
    })

    models.communityMember.belongsToMany(models.communityMember, {
      as: 'noMerge',
      through: 'communityMemberNoMerge',
    })

    models.communityMember.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.communityMember.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.communityMember.belongsTo(models.user, {
      as: 'updatedBy',
    })

    models.communityMember.belongsToMany(models.communityMember, {
      as: 'toMerge',
      through: 'communityMemberToMerge',
    })
  }

  return communityMember
}
