import request from 'supertest'
import SequelizeTestUtils from '../../../database/utils/sequelizeTestUtils'
import Plans from '../../../security/plans'
import MicroserviceService from '../../../services/microserviceService'
import app from '../../index'

const db = null

describe('Microservice protected fields tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Microservice create protected fields', () => {
    it('Should return 200 with free variant', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        type: 'check_merge',
        variant: 'default',
      }
      return request(app)
        .post(`/tenant/${tenantId}/microservice`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })

    it('Should return 403 with a premium microservice in a free tenant', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        type: 'check_merge',
        variant: 'premium',
      }
      return request(app)
        .post(`/tenant/${tenantId}/microservice`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(403)
        })
    })

    it('Should return 200 with a premium microservice in a premium tenant', async () => {
      const plan = Plans.values.growth
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        type: 'check_merge',
        variant: 'premium',
      }
      return request(app)
        .post(`/tenant/${tenantId}/microservice`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })

  })

  describe('Microservice update protected fields', () => {
    it('Should return 200 without protected variables', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const microServiceId = (
        await new MicroserviceService(mockIServiceOptions).create({
          type: 'check_merge',
          running: false,
          variant: 'default',
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        running: true,
      }
      return request(app)
        .put(`/tenant/${tenantId}/microservice/${microServiceId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })

    it('Should return 200 when updating with default variant', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const microServiceId = (
        await new MicroserviceService(mockIServiceOptions).create({
          type: 'check_merge',
          running: false,
          variant: 'default',
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        running: true,
        variant: 'default',
      }
      return request(app)
        .put(`/tenant/${tenantId}/microservice/${microServiceId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })

    it('Should return 403 when updating with to premium variant in free tenant', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const microServiceId = (
        await new MicroserviceService(mockIServiceOptions).create({
          type: 'check_merge',
          running: false,
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        running: true,
        variant: 'premium',
      }
      return request(app)
        .put(`/tenant/${tenantId}/microservice/${microServiceId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(403)
        })
    })

    it('Should return 200 when updating with premium variant in premium tenant', async () => {
      const plan = Plans.values.growth
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const microServiceId = (
        await new MicroserviceService(mockIServiceOptions).create({
          type: 'check_merge',
          running: false,
          variant: 'default',
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        running: true,
        variant: 'premium',
      }
      return request(app)
        .put(`/tenant/${tenantId}/microservice/${microServiceId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })

    it('Should return 200 when updating from premium to default in premium tenant', async () => {
      const plan = Plans.values.growth
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const microServiceId = (
        await new MicroserviceService(mockIServiceOptions).create({
          type: 'check_merge',
          running: false,
          variant: 'premium',
        })
      ).id
      const tenantId = mockIServiceOptions.currentTenant.get({ plain: true }).id
      const token = SequelizeTestUtils.getUserToken(mockIServiceOptions)
      const data = {
        running: true,
        variant: 'default',
      }
      return request(app)
        .put(`/tenant/${tenantId}/microservice/${microServiceId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ ...data })
        .then((response) => {
          expect(response.statusCode).toBe(200)
        })
    })
  })
})
