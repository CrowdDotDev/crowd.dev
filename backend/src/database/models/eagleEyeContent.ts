import { DataTypes } from 'sequelize'

const eagleEyeContentModel = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false
  },
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

    models.eagleEyeContent.belongsTo(models.user, {
      as: 'actionBy',
    })

  }

  return eagleEyeContent
}

export { eagleEyeContentModel }
