import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const path = require('path')

const env = dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
})

dotenvExpand.expand(env)
