import { DataTypes } from 'sequelize'

const eagleEyeContentModel = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sourceId: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  vectorId: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  status: {
    type: DataTypes.STRING(255),
    validate: {
      isIn: [['engaged', 'rejected']],
    },
    defaultValue: null,
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
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
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
    default: {},
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
      as: 'createdBy',
    })

    models.eagleEyeContent.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return eagleEyeContent
}

export { eagleEyeContentModel }
