import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const customViewOrder = sequelize.define('customViewOrder', {
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  })

  customViewOrder.associate = (models) => {
    customViewOrder.belongsTo(models.customView, {
      as: 'customViewId',
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false,
      },
    })

    customViewOrder.belongsTo(models.member, {
      as: 'memberId',
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return customViewOrder
}
