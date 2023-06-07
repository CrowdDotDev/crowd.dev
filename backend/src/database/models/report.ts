import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const report = sequelize.define(
    'report',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isTemplate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      viewedBy: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['importHash', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  report.associate = (models) => {
    models.report.hasMany(models.widget, {
      as: 'widgets',
      constraints: false,
      foreignKey: 'reportId',
      onDelete: 'cascade',
    })

    models.report.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.report.belongsTo(models.segment, {
      as: 'segment',
      foreignKey: {
        allowNull: false,
      },
    })

    models.report.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.report.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return report
}
