import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const repo = sequelize.define(
    'repo',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      info: {
        type: DataTypes.JSONB,
      },
      crowdInfo: {
        type: DataTypes.JSONB,
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
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
        {
          unique: true,
          fields: ['url', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  repo.associate = (models) => {
    models.repo.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.repo.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.repo.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return repo
}
