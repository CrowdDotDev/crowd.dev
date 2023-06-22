import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const tag = sequelize.define(
    'tag',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
          fields: ['name', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  tag.associate = (models) => {
    models.tag.belongsToMany(models.member, {
      as: 'members',
      through: 'memberTags',
      foreignKey: 'tagId',
    })

    models.tag.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.tag.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.tag.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return tag
}
