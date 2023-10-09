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
        // allowNull is set to false in the migration.
        // Keeping it here causes an error as Sequelize validation happens before triggers.
        // allowNull: false,
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
