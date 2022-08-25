const db = require('../db.json')

module.exports = {
  token: {
    withTenant: 'withTenant',
    withoutTenant: 'withoutTenant'
  },
  me: {
    withTenant: {
      ...db.user[0],
      tenants: [
        {
          tenant: db.tenant[0],
          roles: ['admin'],
          status: 'active',
          updatedAt: '2022-01-25T16:39:29.935Z',
          createdAt: '2022-01-25T16:39:29.935Z',
          id: 'tenantUser-10'
        }
      ],
      createdAt: '2021-08-26T14:54:56.359Z',
      updatedAt: '2021-08-26T14:55:02.957Z',
      id: 'tenantUser-10'
    },
    withoutTenant: {
      emailVerified: true,
      email: 'new.user@email.com',
      firstName: 'John',
      fullName: 'John Doe',
      avatars: [],
      tenants: [],
      createdAt: '2021-08-26T14:54:56.359Z',
      updatedAt: '2021-08-26T14:55:02.957Z',
      id: 'user-10'
    }
  }
}
