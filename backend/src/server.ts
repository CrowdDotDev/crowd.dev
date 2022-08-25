/* eslint import/first: 0 */

/*
 * Starts the application on the port specified.
 */

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const env = dotenv.config()
dotenvExpand.expand(env)

import api from './api'

const PORT = process.env.PORT || 8080

api.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
