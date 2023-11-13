import Axios from 'axios'
import { OPEN_STATUS_API_CONFIG } from '../../conf'

export default async (req, res) => {
  const response = await Axios.get(OPEN_STATUS_API_CONFIG.baseUrl)

  return req.responseHandler.success(req, res, response.data)
}
