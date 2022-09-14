/* eslint import/first: 0 */

/*
 * Starts the application on the port specified.
 */

import api from '../api'
import { API_CONFIG } from '../config'

const PORT = API_CONFIG.port || 8080

api.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
