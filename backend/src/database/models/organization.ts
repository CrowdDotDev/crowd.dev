import { DataTypes, Op } from 'sequelize'

export default (sequelize) => {
  const organization = sequelize.define(
    'organization',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      isTeamOrganization: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },

      lastEnrichedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      manuallyCreated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
          fields: ['url', 'tenantId'],
          unique: true,
          where: {
            deletedAt: null,
            url: { [Op.ne]: null },
          },
        },
        {
          fields: ['name', 'tenantId'],
          unique: true,
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
    models.organization.belongsToMany(models.member, {
      as: 'members',
      through: 'memberOrganizations',
      foreignKey: 'organizationId',
    })

    models.organization.belongsToMany(models.segment, {
      as: 'segments',
      through: 'organizationSegments',
      timestamps: false,
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
