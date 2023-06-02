import { getServiceLogger } from '@crowd/logging'
import models from '../models'

const log = getServiceLogger()

models()
  .sequelize.sync({ alter: true })
  .then(() => {
    log.info('Database tables created!')
    process.exit()
  })
  .catch((error) => {
    log.error(error, 'Error while creating database tables!')
    process.exit(1)
  })
