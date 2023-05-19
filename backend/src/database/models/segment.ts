import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const activity = sequelize.define(
    'segment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: DataTypes.TEXT,
      },
      name: {
        type: DataTypes.TEXT,
      },
      parentName: {
        type: DataTypes.TEXT,
      },
      grandparentName: {
        type: DataTypes.TEXT,
      },
      slug: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      parentSlug: {
        type: DataTypes.TEXT,
      },
      grandparentSlug: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.TEXT,
        validate: {
          isIn: [['active', 'archived', 'formation', 'prospect']],
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      sourceId: {
        type: DataTypes.TEXT,
      },
      sourceParentId: {
        type: DataTypes.TEXT,
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
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['slug', 'parentSlug', 'grandparentSlug', 'tenantId'],
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  return activity
}
