import authAxios from '@/shared/axios/auth-axios';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import { AuthService } from '@/modules/auth/services/auth.service';
import config from '@/config';

export class TenantService {
  static async fetchAndApply() {
    const tenantUrl = tenantSubdomain.fromLocationHref();

    if (
      tenantSubdomain.isEnabled
      && tenantSubdomain.isRootDomain
    ) {
      return;
    }

    // If there is a subdomain with the tenant url,
    // it must fetch the settings form that subdomain no matter
    // which one is on local storage
    let tenant;
    if (tenantUrl) {
      try {
        tenant = await this.findByUrl(tenantUrl);
      } catch (error) {
        console.error(error);
      }

      if (!tenant) {
        window.location.href = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
        return;
      }
    }

    const tenantId = AuthService.getTenantId();
    if (tenantId && !tenantUrl) {
      try {
        tenant = await this.find(tenantId);
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line consistent-return
    return tenant;
  }

  static async update(id, data) {
    const response = await authAxios.put(
      `/tenant/${id}`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
      excludeSegments: true,
    };

    const response = await authAxios.delete('/tenant', {
      params,
    });

    return response.data;
  }

  static async create(data) {
    const response = await authAxios.post('/tenant', {
      ...data,
      excludeSegments: true,
    });

    return response.data;
  }

  static async viewOrganizations() {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.post(`/tenant/${tenantId}/viewOrganizations`);

    return response.data;
  }

  static async viewContacts() {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.post(`/tenant/${tenantId}/viewContacts`);

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
        excludeSegments: true,
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
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async find(id) {
    const response = await authAxios.get(`/tenant/${id}`, {
      params: {
        excludeSegments: true,
      },
    });
    return response.data;
  }

  static async findName(id) {
    const response = await authAxios.get(`/tenant/${id}/name`);
    return response.data;
  }

  static async findByUrl(url) {
    const response = await authAxios.get('/tenant/url', {
      params: { url, excludeSegments: true },
    });
    return response.data;
  }

  static async list(filter, orderBy, limit, offset) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
      excludeSegments: true,
    };

    const response = await authAxios.get('/tenant', {
      params,
    });

    return response.data;
  }

  static async populateSampleData(tenantId) {
    const response = await authAxios.post(
      `/tenant/${tenantId}/sampleData`,
      {
        excludeSegments: true,
      },
    );

    return response.data;
  }
}
