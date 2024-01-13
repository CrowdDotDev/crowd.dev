import axios from 'axios';
import { Error400 } from '@crowd/common';
import Permissions from '../../../security/permissions';
import PermissionChecker from '../../../services/user/permissionChecker';

export default async (req, res) => {
  new PermissionChecker(req).validateHasAny([
    Permissions.values.integrationCreate,
    Permissions.values.integrationEdit,
  ]);

  const { jiraURL, jiraUsername, jiraUserToken } = req.body;

  if (jiraURL) { 
    const headers: { Authorization?: string } = {};
    if (jiraUsername && jiraUserToken) {
      headers.Authorization = `Basic ${Buffer.from(`${jiraUsername}:${jiraUserToken}`).toString('base64')}`;
    }

    try {
      // if (jiraUsername && jiraUserToken) {
      //   const userValidationEndpoint = `${jiraURL}/rest/api/2/myself`;
      //   const resultMyself = await axios.get(userValidationEndpoint, { headers });
      // }

      const projectEndpoint = `${jiraURL}/rest/api/2/project`;
      const result = await axios.get(projectEndpoint, { headers });
      if (result.status === 200 && result.data && result.data.length > 0) {
        return req.responseHandler.success(req, res, result.data);
      }

    } catch (e) {
      return req.responseHandler.error(req, res, new Error400(req.language));
    }
  }

  return req.responseHandler.error(req, res, new Error400(req.language));
};
