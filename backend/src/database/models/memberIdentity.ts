import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const memberIdentity = sequelize.define('memberIdentity', {
    memberId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    platform: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    username: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    sourceId: {
      type: DataTypes.TEXT,
    },
    tenantId: {
      type: DataTypes.UUID,
    },
    integrationId: {
      type: DataTypes.UUID,
    },
  })

  memberIdentity.associate = (models) => {
    models.memberIdentity.belongsTo(models.member, {
      foreignKey: 'memberId',
      as: 'member',
    })
  }

  return memberIdentity
}
