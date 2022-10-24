import { QueryInterface } from 'sequelize/types'

export const up = async (queryInterface: QueryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    // add tenant.integrationsRequired
    await queryInterface.addColumn(
      'tenants',
      'integrationsRequired',
      { type: Sequelize.ARRAY(Sequelize.STRING(50)) },
      { transaction },
    )

    await queryInterface.addColumn(
      'tenants',
      'communitySize',
      {
        type: Sequelize.STRING(50),
        validate: {
          isIn: [['<200', '200-1000', '1000-5000', '5000-25000', '>25000']],
        },
      },
      { transaction },
    )

    return await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface: QueryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.removeColumn('tenants', 'integrationsRequired', { transaction })
    await queryInterface.removeColumn('tenants', 'communitySize', { transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
