import { DataTypes } from 'sequelize'

const eagleEyeContentModel = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  platform: {
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
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  postedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}

export default (sequelize) => {
  const eagleEyeContent = sequelize.define('eagleEyeContent', eagleEyeContentModel, {
    timestamps: true,
    paranoid: false,
  })

  eagleEyeContent.associate = (models) => {
    models.eagleEyeContent.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })
    models.eagleEyeContent.hasMany(models.eagleEyeAction, {
      as: 'actions',
      foreignKey: 'contentId',
    })

  }

  return eagleEyeContent
}

export { eagleEyeContentModel }
