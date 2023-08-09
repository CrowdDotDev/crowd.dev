import { DataTypes } from 'sequelize'
import { CustomViewVisibility } from '@crowd/types'

export default (sequelize) => {
  const customView = sequelize.define(
    'customView',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      visibility: {
        type: DataTypes.ENUM,
        values: Object.values(CustomViewVisibility),
        allowNull: false,
      },
      config: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      placement: {
        type: DataTypes.STRING,
        validate: {
          isIn: [['member', 'organization', 'activity', 'conversation']],
        },
      },
    },
  )

  return customView
}
