import { DataTypes, Op } from 'sequelize'

export default (sequelize) => {
  const organizationCache = sequelize.define(
    'organizationCache',
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
        allowNull: true,
      },
      description: {
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
      twitter: {
        type: DataTypes.JSONB,
        default: {},
      },
      linkedin: {
        type: DataTypes.JSONB,
        default: {},
      },
      github: {
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
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      website: {
        type: DataTypes.TEXT,
        allowNull: true,
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
        comment: "The company's type. For example NGO",
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
      lastEnrichedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      indexes: [
        {
          fields: ['url'],
          unique: true,
          where: {
            deletedAt: null,
            url: { [Op.ne]: null },
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  return organizationCache
}
