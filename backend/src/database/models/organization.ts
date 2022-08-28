import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const organization = sequelize.define(
    'organization',
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
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      emailAddresses: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        default: [],
      },
      phoneNumbers: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        default: [],
      },
      logo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        default: [],
      },
      twitter: {
        type: DataTypes.JSONB,
        allowNull: false,
        default: {},
      },
      linkedin: {
        type: DataTypes.JSONB,
        allowNull: false,
        default: {},
      },
      crunchbase: {
        type: DataTypes.JSONB,
        allowNull: false,
        default: {},
      },
      employees: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      annualRevenueRange: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
        validator: {
          isArray: true,
          len: 2,
        },
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
          unique: true,
          fields: ['url', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  organization.associate = (models) => {
    models.organization.belongsToMany(models.communityMember, {
      as: 'communityMembers',
      through: 'communityMemberOrganizations',
      foreignKey: 'organizationId',
    })

    models.organization.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.organization.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.organization.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return organization
}
