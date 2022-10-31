import api from '../api'
import { API_CONFIG } from '../config'

const PORT = API_CONFIG.port || 8080

api.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
