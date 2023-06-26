import { MemberAttributeType } from '@crowd/types'
import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const memberAttributeSettings = sequelize.define(
    'memberAttributeSettings',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM,
        values: Object.values(MemberAttributeType),
        allowNull: false,
      },
      canDelete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      label: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      options: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['name', 'tenantId'],
        },
      ],
      timestamps: true,
    },
  )

  memberAttributeSettings.associate = (models) => {
    models.memberAttributeSettings.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.memberAttributeSettings.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.memberAttributeSettings.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return memberAttributeSettings
}
