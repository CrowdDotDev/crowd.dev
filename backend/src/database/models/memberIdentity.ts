import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const memberIdentity = sequelize.define('memberIdentity', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.UUID,
    },
    platform: {
      type: DataTypes.TEXT,
    },
    value: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.TEXT,
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
