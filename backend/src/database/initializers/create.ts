/**
 * This script is responsible for create the SQL tables.
 * Run it via `npm run db:create:test`.
 */

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import models from '../models'

const path = require('path')

const environmentArg = process.argv[2]

const envFile = environmentArg === 'dev' ? '.env' : `.env-${environmentArg}`

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../${envFile}`),
})

dotenvExpand.expand(env)

models()
  .sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database tables created!')
    process.exit()
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
