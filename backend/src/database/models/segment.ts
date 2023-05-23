import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const segment = sequelize.define(
    'segment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: DataTypes.TEXT,
      },
      name: {
        type: DataTypes.TEXT,
      },
      parentName: {
        type: DataTypes.TEXT,
      },
      grandparentName: {
        type: DataTypes.TEXT,
      },
      slug: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      parentSlug: {
        type: DataTypes.TEXT,
      },
      grandparentSlug: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.TEXT,
        validate: {
          isIn: [['active', 'archived', 'formation', 'prospect']],
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      sourceId: {
        type: DataTypes.TEXT,
      },
      sourceParentId: {
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['slug', 'parentSlug', 'grandparentSlug', 'tenantId'],
        },
      ],
      timestamps: false,
      paranoid: false,
    },
  )

  segment.associate = (models) => {
    models.segment.belongsTo(models.tenant, {
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return segment
}
