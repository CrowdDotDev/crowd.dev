import Axios from 'axios';

export class LayoutService {
  static async getSystemStatus() {
    const response = await Axios.get(
      'https://api.openstatus.dev/public/status/crowddev',
    );

    return response.data;
  }
}
