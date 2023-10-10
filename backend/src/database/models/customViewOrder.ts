import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const customViewOrder = sequelize.define(
    'customViewOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
    },
    {
      indexes: [
        {
          fields: ['id', 'userId', 'customViewId'],
          where: {
            deletedAt: null,
          },
        },
        {
          name: 'customViewOrder_unique',
          unique: true,
          fields: ['userId', 'customViewId'],
        },
      ],
      paranoid: true,
    },
  )

  customViewOrder.associate = (models) => {
    customViewOrder.belongsTo(models.customView, {
      as: 'customView',
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false,
      },
    })

    customViewOrder.belongsTo(models.user, {
      as: 'user',
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return customViewOrder
}
