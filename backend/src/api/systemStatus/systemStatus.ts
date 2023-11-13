import Axios from 'axios'

export default async (req, res) => {
  const response = await Axios.get('https://api.openstatus.dev/public/status/crowddev')

  return req.responseHandler.success(req, res, response.data)
}
