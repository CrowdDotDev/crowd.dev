import { DataTypes } from 'sequelize'

const eagleEyeContentModel = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  action: {
    type: DataTypes.TEXT,
    validate: {
      isIn: [['thumbs-up', 'thumbs-down', 'bookmark']],
    },
    defaultValue: null,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  post: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  text: {
    type: DataTypes.TEXT,
  },

  platform: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  keywords: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    default: [],
  },
  exactKeywords: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    default: [],
  },
  similarityScore: {
    type: DataTypes.FLOAT,
  },
  userAttributes: {
    type: DataTypes.JSONB,
  },
  postAttributes: {
    type: DataTypes.JSONB,
    default: {},
  },
  importHash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255],
    },
  },
}

export default (sequelize) => {
  const eagleEyeContent = sequelize.define('eagleEyeContent', eagleEyeContentModel, {
    indexes: [
      {
        unique: true,
        fields: ['importHash', 'tenantId'],
        where: {
          deletedAt: null,
        },
      },
      {
        fields: ['platform', 'tenantId', 'timestamp'],
        where: {
          deletedAt: null,
        },
      },
      {
        fields: ['status', 'tenantId', 'timestamp'],
        where: {
          deletedAt: null,
        },
      },
      {
        fields: ['tenantId', 'timestamp'],
        where: {
          deletedAt: null,
        },
      },
    ],
    timestamps: true,
    paranoid: true,
  })

  eagleEyeContent.associate = (models) => {
    models.eagleEyeContent.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.eagleEyeContent.belongsTo(models.user, {
      as: 'actionBy',
    })

  }

  return eagleEyeContent
}

export { eagleEyeContentModel }
