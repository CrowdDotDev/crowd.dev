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
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      indexes: [
        {
          fields: ['id'],
          where: {
            deletedAt: null,
          },
        },
      ],
      createdAt: false,
      updatedAt: false,
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

    customViewOrder.belongsTo(models.member, {
      as: 'member',
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return customViewOrder
}
