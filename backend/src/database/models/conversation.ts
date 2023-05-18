import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const conversation = sequelize.define(
    'conversation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      published: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['slug', 'tenantId'],
        },
      ],
      timestamps: true,
    },
  )

  conversation.associate = (models) => {
    models.conversation.hasMany(models.activity, {
      as: 'activities',
    })

    models.conversation.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.conversation.belongsTo(models.segment, {
      as: 'segment',
      foreignKey: {
        allowNull: false,
      },
    })

    models.conversation.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.conversation.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return conversation
}
