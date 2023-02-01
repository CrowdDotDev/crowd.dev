import { DataTypes } from 'sequelize'

const eagleEyeActionModel = {
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
  }
}

export default (sequelize) => {
  const eagleEyeAction = sequelize.define('eagleEyeAction', eagleEyeActionModel, {
    timestamps: true,
    paranoid: false,
  })

  eagleEyeAction.associate = (models) => {
    models.eagleEyeContent.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.eagleEyeAction.belongsTo(models.user, {
      as: 'actionBy',
    })

    models.eagleEyeAction.belongsTo(models.eagleEyeContent, {
        as: 'content',
    })
  }

  return eagleEyeAction
}

export { eagleEyeActionModel }
