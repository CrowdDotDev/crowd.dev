import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import SampleDataService from '../sampleDataService'
import TenantService from '../tenantService'
import ActivityService from '../activityService'
import MemberService from '../memberService'
import { PlatformType } from '../../utils/platforms'
import { MemberAttributeName } from '../../database/attributes/member/enums'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import { GithubMemberAttributes } from '../../database/attributes/member/github'
import { TwitterMemberAttributes } from '../../database/attributes/member/twitter'

const db = null

describe('SampleDataService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })
  describe('generateSampleData', () => {
    it('Should succesfully generate sample data for discord and github', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const memberService = new MemberService(mockIServiceOptions)
      const tenantService = new TenantService(mockIServiceOptions)
      const sampleDataService = new SampleDataService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)
      await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)

      const testSampleData = require('./test-sample-data.json')

      // create an ordinary member with activities
      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
            [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Computer Science',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Istanbul',
          },
        },
        organisation: 'Crowd',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        attributes: {
          body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
          title: 'Dashboard widgets and some other tweaks/adjustments',
          state: 'merged',
          url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
          repo: 'https://github.com/CrowdDevHQ/crowd-web',
        },
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        isKeyAction: true,
        platform: PlatformType.GITHUB,
        score: 4,
        sourceId: '#sourceId0',
      }

      await new ActivityService(mockIServiceOptions).createWithMember(data)

      // import sample data
      await sampleDataService.generateSampleData(testSampleData)

      // get tenant
      let updatedTenant = await tenantService.findById(
        mockIServiceOptions.currentTenant.id,
        mockIServiceOptions,
      )

      // fetch all members
      let allMembers = await memberService.findAndCountAll({})

      // 3 sample members, 1 ordinary member
      expect(allMembers.count).toEqual(4)
      expect(updatedTenant.hasSampleData).toBeTruthy()

      let sampleMembers = allMembers.rows.filter(
        (m) =>
          m.attributes[MemberAttributeName.SAMPLE] &&
          m.attributes[MemberAttributeName.SAMPLE][PlatformType.CROWD] === true,
      )

      expect(sampleMembers.length).toEqual(3)
      expect(allMembers.count - sampleMembers.length).toEqual(1)

      // multiple calls should result in same result because we're upserting members and activities
      await sampleDataService.generateSampleData(testSampleData)

      updatedTenant = await tenantService.findById(
        mockIServiceOptions.currentTenant.id,
        mockIServiceOptions,
      )

      allMembers = await memberService.findAndCountAll({})

      expect(allMembers.count).toEqual(4)
      expect(updatedTenant.hasSampleData).toBeTruthy()

      sampleMembers = allMembers.rows.filter(
        (m) =>
          m.attributes[MemberAttributeName.SAMPLE] &&
          m.attributes[MemberAttributeName.SAMPLE][PlatformType.CROWD] === true,
      )

      expect(sampleMembers.length).toEqual(3)
      expect(allMembers.count - sampleMembers.length).toEqual(1)
    })
  })
  describe('deleteSampleData method', () => {
    it('Should succesfully delete previously created sample data', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const memberService = new MemberService(mockIServiceOptions)
      const tenantService = new TenantService(mockIServiceOptions)
      const sampleDataService = new SampleDataService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
      await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

      const testSampleData = require('./test-sample-data.json')

      // create an ordinary member with activities
      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
            [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Computer Science',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Istanbul',
          },
        },
        organisation: 'Crowd',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        attributes: {
          body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
          title: 'Dashboard widgets and some other tweaks/adjustments',
          state: 'merged',
          url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
          repo: 'https://github.com/CrowdDevHQ/crowd-web',
        },
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        isKeyAction: true,
        platform: PlatformType.GITHUB,
        score: 4,
        info: {},
        sourceId: '#sourceId0',
      }

      await new ActivityService(mockIServiceOptions).createWithMember(data)

      // import sample data
      await sampleDataService.generateSampleData(testSampleData)

      // delete sample data
      await sampleDataService.deleteSampleData()

      // get tenant
      let updatedTenant = await tenantService.findById(
        mockIServiceOptions.currentTenant.id,
        mockIServiceOptions,
      )

      // get all members
      let allMembers = await memberService.findAndCountAll({})

      // There should be only 1 ordinary member, samples are deleted
      expect(allMembers.count).toEqual(1)
      expect(updatedTenant.hasSampleData).toBeFalsy()

      let sampleMembers = allMembers.rows.filter(
        (m) =>
          m.attributes[MemberAttributeName.SAMPLE] &&
          m.attributes[MemberAttributeName.SAMPLE][PlatformType.CROWD] === true,
      )

      expect(sampleMembers.length).toEqual(0)

      // multiple calls should result in same result
      await sampleDataService.deleteSampleData()

      updatedTenant = await tenantService.findById(
        mockIServiceOptions.currentTenant.id,
        mockIServiceOptions,
      )

      allMembers = await memberService.findAndCountAll({})

      expect(allMembers.count).toEqual(1)
      expect(updatedTenant.hasSampleData).toBeFalsy()

      sampleMembers = allMembers.rows.filter(
        (m) =>
          m.attributes[MemberAttributeName.SAMPLE] &&
          m.attributes[MemberAttributeName.SAMPLE][PlatformType.CROWD] === true,
      )

      expect(sampleMembers.length).toEqual(0)
    })
  })
})
