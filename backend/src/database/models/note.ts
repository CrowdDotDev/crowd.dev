import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const note = sequelize.define(
    'note',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      body: {
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
      indexes: [],
      timestamps: true,
      paranoid: true,
    },
  )

  note.associate = (models) => {
    models.note.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.note.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.note.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return note
}
