import Roles from '../../security/roles'
import SequelizeArrayUtils from '../utils/sequelizeArrayUtils'

export default (sequelize, DataTypes) => {
  const tenantUser = sequelize.define(
    'tenantUser',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roles: {
        type: SequelizeArrayUtils.DataType,
        validate: {
          isValidOption(value) {
            if (!value || !value.length) {
              return value
            }

            const validOptions: any = Object.keys(Roles.values)

            if (value.some((item) => !validOptions.includes(item))) {
              throw new Error(`${value} is not a valid option`)
            }

            return value
          },
        },
      },
      adminSegments: {
        type: SequelizeArrayUtils.DataType,
      },
      invitationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          isIn: [['active', 'invited', 'empty-permissions']],
        },
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          isEagleEyeGuideDismissed: false,
          isQuickstartGuideDismissed: false,
          eagleEye: {
            onboarded: false,
          },
        },
      },
    },
    {
      timestamps: true,
      paranoid: true,
    },
  )

  tenantUser.associate = (models) => {
    models.tenantUser.belongsTo(models.tenant, {
      foreignKey: {
        allowNull: false,
      },
    })

    models.tenantUser.belongsTo(models.user, {
      foreignKey: {
        allowNull: false,
      },
    })

    models.tenantUser.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.tenantUser.belongsTo(models.user, {
      as: 'updatedBy',
    })

    models.tenantUser.belongsTo(models.user, {
      as: 'invitedBy',
    })
  }

  return tenantUser
}
