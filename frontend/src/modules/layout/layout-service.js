import Axios from 'axios';

export class LayoutService {
  static async getSystemStatus() {
    const response = await Axios.get(
      '/system-status',
    );

    return response.data;
  }
}
