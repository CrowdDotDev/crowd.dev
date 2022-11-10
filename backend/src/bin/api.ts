import { getServiceLogger } from '../utils/logging'
import api from '../api'
import { API_CONFIG } from '../config'

const PORT = API_CONFIG.port || 8080

const log = getServiceLogger()

api.listen(PORT, () => {
  log.info(`Listening on port ${PORT}`)
})
