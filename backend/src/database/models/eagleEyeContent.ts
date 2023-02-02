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
  content: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  }
}

export default (sequelize) => {
  const eagleEyeContent = sequelize.define('eagleEyeContent', eagleEyeContentModel, {
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

  }

  return eagleEyeContent
}

export { eagleEyeContentModel }
