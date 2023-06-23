export default (sequelize, DataTypes) => {
  const usersAuthentication = sequelize.define(
    'usersAuthentication',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        authMethod: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
      }
  )

  usersAuthentication.associate = (models) => {
    models.tenantUser.belongsTo(models.user, {
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return usersAuthentication
}
