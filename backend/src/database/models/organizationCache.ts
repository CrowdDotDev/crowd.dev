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
      crunchbase: {
        type: DataTypes.JSONB,
        default: {},
      },
      employees: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      revenueRange: {
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
