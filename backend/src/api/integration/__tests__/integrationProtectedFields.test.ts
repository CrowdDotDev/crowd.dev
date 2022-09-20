import request from 'supertest'
import SequelizeTestUtils from '../../../database/utils/sequelizeTestUtils'
import Plans from '../../../security/plans'
import IntegrationService from '../../../services/integrationService'
import app from '../../index'
import { PlatformType } from '../../../utils/platforms'

const db = null

describe('Integration protected fields tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Integration create protected fields', () => {
    it('Should create an integratio without protected variables', async () => {
      const plan = Plans.values.free
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        platform: PlatformType.GITHUB,
      }
      return request(app)
        .post(`/api/tenant/${tenantId}/integration`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })
    it('Should throw an error when limitCount is passed for a free plan', async () => {
      const plan = Plans.values.free
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        platform: PlatformType.GITHUB,
        limitCount: 1,
      }
      return request(app)
        .post(`/api/tenant/${tenantId}/integration`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(403)
        })
    })
  })

  describe('Integration update protected fields', () => {
    it('Should update an integratiom without protected variables', async () => {
      const plan = Plans.values.free
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const integrationId = (
        await new IntegrationService(mockIServiceOptions).create({
          platform: PlatformType.GITHUB,
          status: 'in-progress',
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        status: 'done',
      }
      return request(app)
        .put(`/api/tenant/${tenantId}/integration/${integrationId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })
    it('Should throw an error when limitCount is passed', async () => {
      const plan = Plans.values.free
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const integrationId = (
        await new IntegrationService(mockIServiceOptions).create({
          platform: PlatformType.GITHUB,
          status: 'in-progress',
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        status: 'done',
        limitCount: 0,
      }
      return request(app)
        .put(`/api/tenant/${tenantId}/integration/${integrationId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(403)
        })
    })
  })
})
