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
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      displayName: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      website: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'A detailed description of the company',
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parentUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      emails: {
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
      github: {
        type: DataTypes.JSONB,
        default: {},
      },
      twitter: {
        type: DataTypes.JSONB,
        default: {},
      },
      linkedin: {
        type: DataTypes.JSONB,
        default: {},
      },
      crunchbase: {
        type: DataTypes.JSONB,
        default: {},
      },
      employees: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      revenueRange: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      founded: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      industry: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      size: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'A range representing the size of the company.',
      },
      naics: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull: true,
        comment: 'industry classifications for a company according to NAICS',
      },
      headline: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'A brief description of the company',
      },
      ticker: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "the company's stock symbol",
      },
      geoLocation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "The comnapny's type. For example NGO",
      },
      employeeCountByCountry: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      address: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: "granular information about the location of the company's current headquarters.",
      },
      profiles: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
      },
      lastEnrichedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
