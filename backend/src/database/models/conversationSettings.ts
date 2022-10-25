import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const conversationSettings = sequelize.define('conversationSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    customUrl: {
      type: DataTypes.TEXT,
    },
    logoUrl: {
      type: DataTypes.TEXT,
    },
    faviconUrl: {
      type: DataTypes.TEXT,
    },
    theme: {
      type: DataTypes.JSONB,
    },
    autoPublish: {
      type: DataTypes.JSONB,
    },
  })

  conversationSettings.associate = (models) => {
    models.conversationSettings.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.conversationSettings.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.conversationSettings.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return conversationSettings
}
