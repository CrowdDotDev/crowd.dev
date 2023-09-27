import { DataTypes } from 'sequelize'
import { CustomViewVisibility } from '@crowd/types'

export default (sequelize) => {
  const customView = sequelize.define(
    'customView',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      visibility: {
        type: DataTypes.ENUM,
        values: Object.values(CustomViewVisibility),
        allowNull: false,
      },
      config: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      placement: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        validate: {
          isIn: [['members', 'organizations', 'activities', 'conversations']],
        },
      },
    },
    {
      indexes: [
        {
          unqiue: true,
          fields: ['id', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  customView.associate = (models) => {
    models.customView.belongsTo(models.tenant, {
      as: 'tenantId',
      foreignKey: {
        allowNull: false,
      },
    })

    models.customView.belongsTo(models.member, {
      as: 'createdById',
    })

    models.customView.belongsTo(models.member, {
      as: 'updatedById',
    })
  }

  return customView
}
