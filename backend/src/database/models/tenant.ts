import Plans from '../../security/plans'

const plans = Plans.values

export default (sequelize, DataTypes) => {
  const tenant = sequelize.define(
    'tenant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validation: {
          notEmpty: true,
          len: [0, 255],
        },
      },
      url: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validation: {
          notEmpty: true,
          len: [0, 50],
        },
      },
      integrationsRequired: {
        type: DataTypes.ARRAY(DataTypes.STRING(50)),
      },
      communitySize: {
        type: DataTypes.STRING(50),
        validate: {
          isIn: [['<200', '200-1000', '1000-5000', '5000-25000', '>25000']],
        },
      },
      reasonForUsingCrowd: {
        type: DataTypes.STRING(50),
      },
      plan: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          isIn: [[plans.essential, plans.growth, plans.eagleEye, plans.enterprise]],
        },
        defaultValue: plans.essential,
      },

      onboardedAt: {
        type: DataTypes.DATE,
      },
      hasSampleData: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isTrialPlan: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      trialEndsAt: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      stripeSubscriptionId: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      planSubscriptionEndsAt: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['url'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  tenant.associate = (models) => {
    models.tenant.hasMany(models.settings, {
      as: 'settings',
    })

    models.tenant.hasMany(models.conversationSettings, {
      as: 'conversationSettings',
    })

    models.tenant.hasMany(models.tenantUser, {
      as: 'users',
    })

    models.tenant.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.tenant.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return tenant
}
