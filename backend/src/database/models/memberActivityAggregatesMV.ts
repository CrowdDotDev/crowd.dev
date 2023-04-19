import { DataTypes } from 'sequelize'

export default (sequelize) => {
  // define your materialized view model
  const memberActivityAggregatesMV = sequelize.define('memberActivityAggregatesMV', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    activeOn: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    averageSentiment: {
      type: DataTypes.FLOAT,
    },
    activityCount: {
      type: DataTypes.INTEGER,
    },
    activeDaysCount: {
      type: DataTypes.INTEGER,
    },
    identities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    username: {
      type: DataTypes.JSONB,
    },
  })

  return memberActivityAggregatesMV
}
