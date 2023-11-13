import Axios from 'axios';
import config from '@/config';
import { Status } from '@/modules/layout/types/SystemStatus';

export default {
  async getSystemStatus(): Promise<{ status: Status }> {
    const url = config.env === 'local'
      ? '/system-status'
      : 'https://api.openstatus.dev/public/status/crowddev';

    const response = await Axios.get(url);

    return response.data;
  },
};
