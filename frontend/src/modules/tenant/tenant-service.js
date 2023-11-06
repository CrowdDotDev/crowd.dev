import authAxios from '@/shared/axios/auth-axios';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import config from '@/config';

export class TenantService {
  static async fetchAndApply() {
    const tenantUrl = tenantSubdomain.fromLocationHref();

    if (
      tenantSubdomain.isEnabled
      && tenantSubdomain.isRootDomain
    ) {
      AuthCurrentTenant.clear();
      return;
    }

    // If there is a subdomain with the tenant url,
    // it must fetch the settings form that subdomain no matter
    // which one is on local storage
    if (tenantUrl) {
      let currentTenant;
      try {
        currentTenant = await this.findByUrl(tenantUrl);
      } catch (error) {
        console.error(error);
      }

      AuthCurrentTenant.set(currentTenant);

      if (!currentTenant) {
        window.location.href = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
        return;
      }
    }

    const tenantId = AuthCurrentTenant.get();
    if (tenantId && !tenantUrl) {
      try {
        const currentTenant = await this.find(tenantId);

        AuthCurrentTenant.set(currentTenant);
      } catch (error) {
        console.error(error);
      }
    }
  }

  static async update(id, data) {
    const response = await authAxios.put(
      `/tenant/${id}`,
      data,
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
    };

    const response = await authAxios.delete('/tenant', {
      params,
    });

    return response.data;
  }

  static async create(data) {
    const response = await authAxios.post('/tenant', data);

    return response.data;
  }

  static async acceptInvitation(
    token,
    forceAcceptOtherEmail = false,
  ) {
    const response = await authAxios.post(
      `/tenant/invitation/${token}/accept`,
      {
        forceAcceptOtherEmail,
      },
    );

    return response.data;
  }

  static async declineInvitation(token) {
    const params = null;

    const response = await authAxios.delete(
      `/tenant/invitation/${token}/decline`,
      {
        params,
      },
    );

    return response.data;
  }

  static async find(id) {
    const response = await authAxios.get(`/tenant/${id}`);
    return response.data;
  }

  static async findName(id) {
    const response = await authAxios.get(`/tenant/${id}/name`);
    return response.data;
  }

  static async findByUrl(url) {
    const response = await authAxios.get('/tenant/url', {
      params: { url },
    });
    return response.data;
  }

  static async list(filter, orderBy, limit, offset) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
    };

    const response = await authAxios.get('/tenant', {
      params,
    });

    return response.data;
  }

  static async populateSampleData(tenantId) {
    const response = await authAxios.post(
      `/tenant/${tenantId}/sampleData`,
    );

    return response.data;
  }
}
