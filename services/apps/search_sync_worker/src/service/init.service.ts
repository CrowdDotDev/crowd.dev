import { IDbActivitySyncData } from '@/repo/activity.data'
import { IDbMemberSyncData } from '@/repo/member.data'
import { OpenSearchIndex } from '@/types'
import { Logger, LoggerBase } from '@crowd/logging'
import { ActivitySyncService } from './activity.sync.service'
import { MemberSyncService } from './member.sync.service'
import { OpenSearchService } from './opensearch.service'
import { IDbOrganizationSyncData } from '@/repo/organization.data'
import { OrganizationSyncService } from './organization.sync.service'

export class InitService extends LoggerBase {
  public static FAKE_TENANT_ID = 'b0e82a13-566f-40e0-b0d0-11fcb6596b0f'
  public static FAKE_SEGMENT_ID = 'ce36b0b0-1fc4-4637-955d-afb8a6b58e48'
  public static FAKE_MEMBER_ID = '9c19e17c-6a07-4f4c-bc9b-ce1fdce9c126'
  public static FAKE_ACTIVITY_ID = 'fa761640-f77c-4340-b56e-bdd0936d852b'
  public static FAKE_CONVERSATION_ID = 'cba1758c-7b1f-4a3c-b6ff-e6f3bdf54c86'
  public static FAKE_ORGANIZATION_ID = 'cba1758c-7b1f-4a3c-b6ff-e6f3bdf54c85'

  constructor(private readonly openSearchService: OpenSearchService, parentLog: Logger) {
    super(parentLog)
  }

  public async initialize(): Promise<void> {
    await this.openSearchService.initialize()

    await this.createFakeMember()
    await this.createFakeActivity()
    await this.createFakeOrganization()
  }

  private async createFakeOrganization(): Promise<void> {
    const fakeOrg: IDbOrganizationSyncData = {
      organizationId: InitService.FAKE_ORGANIZATION_ID,
      tenantId: InitService.FAKE_TENANT_ID,
      segmentId: InitService.FAKE_SEGMENT_ID,
      address: {
        name: 'paris, ile-de-france, france',
        metro: null,
        region: 'ile-de-france',
        country: 'france',
        locality: 'paris',
        continent: 'europe',
        postal_code: null,
        address_line_2: null,
        street_address: null,
      },
      attributes: {},
      createdAt: new Date().toISOString(),
      description: 'Fake organization',
      displayName: 'Fake organization',
      emails: ['fake@org.com'],
      employeeCountByCountry: { US: 10 },
      employees: 10,
      founded: 2010,
      geoLocation: '123,321',
      headline: 'Fake organization',
      importHash: 'fakehash',
      industry: 'Fake industry',
      isTeamOrganization: false,
      lastEnrichedAt: new Date().toISOString(),
      location: 'Unknown City, Unknown Country',
      logo: 'https://placehold.co/400',
      naics: [],
      name: 'Fake organization',
      phoneNumbers: ['123456789'],
      profiles: ['https://placehold.co/400'],
      revenueRange: {},
      size: '10-50',
      type: 'Fake type',
      url: 'https://placehold.co/400',
      website: 'https://placehold.co/400',
      linkedin: {},
      github: {},
      crunchbase: {},
      twitter: {},
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      activeOn: ['devto'],
      activityCount: 10,
      memberCount: 10,
      identities: [
        {
          platform: 'devto',
          name: 'fakeorg',
        },
      ],
      weakIdentities: [
        {
          name: 'fakeWeakIdentity',
          platform: 'github',
          url: 'https://fakeUrl.com',
        },
      ],
      manuallyCreated: false,
      immediateParent: 'Fake parent',
      ultimateParent: 'Fake ultimate parent',
      affiliatedProfiles: ['https://placehold.co/400'],
      allSubsidiaries: ['Fake subsidiary 1', 'Fake subsidiary 2'],
      alternativeDomains: ['www.fake1.org', 'www.fake2.org'],
      alternativeNames: ['Fake name 1', 'Fake name 2'],
      averageEmployeeTenure: 2.8,
      averageTenureByLevel: { cxo: 2, manager: 1.5 },
      averageTenureByRole: {
        customer_service: 1.141,
        engineering: 1.827,
        human_resources: 1.083,
      },
      employeeChurnRate: {
        '3_month': 0.0248,
        '6_month': 0.124,
        '12_month': 0.1983,
        '24_month': 0.3306,
      },
      employeeCountByMonth: {
        '2022-04': 105,
        '2022-05': 112,
        '2022-06': 117,
      },
      employeeGrowthRate: {
        '3_month': 0.0522,
        '6_month': 0.0342,
        '12_month': 0.375,
        '24_month': 1.283,
      },
      employeeCountByMonthByLevel: {
        '2020-01': { cxo: 2, manager: 5 },
        '2020-02': { cxo: 3, manager: 6 },
      },
      employeeCountByMonthByRole: {
        '2020-01': { marketing: 5, engineering: 10 },
        '2020-02': { marketing: 6, engineering: 12 },
      },
      gicsSector: 'Fake GICS sector',
      grossAdditionsByMonth: { '2022-05': 7, '2022-06': 6, '2022-07': 1, '2022-08': 1 },
      grossDeparturesByMonth: { '2022-06': 2, '2022-07': 1, '2022-08': 2, '2022-09': 2 },
      directSubsidiaries: ['Fake direct subsidiary 1', 'Fake direct subsidiary 2'],
    }

    const prepared = OrganizationSyncService.prefixData(fakeOrg)
    await this.openSearchService.index(
      `${InitService.FAKE_ORGANIZATION_ID}-${InitService.FAKE_SEGMENT_ID}`,
      OpenSearchIndex.ORGANIZATIONS,
      prepared,
    )
  }

  private async createFakeMember(): Promise<void> {
    // we need to create a fake member to initialize the index with the proper data
    // it will be created in a nonexisting tenant so no one will see it ever
    // if we don't have anything in the index any search by any field will return an error

    const fakeMember: IDbMemberSyncData = {
      id: InitService.FAKE_MEMBER_ID,
      tenantId: InitService.FAKE_TENANT_ID,
      segmentId: InitService.FAKE_SEGMENT_ID,
      displayName: 'Test Member',
      emails: ['fake@email.com'],
      score: 10,
      lastEnriched: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      totalReach: 20,
      numberOfOpenSourceContributions: 10,

      activeOn: ['devto'],
      activityCount: 10,
      activityTypes: ['devto:comment'],
      activeDaysCount: 20,
      lastActive: new Date().toISOString(),
      averageSentiment: 20.32,

      identities: [
        {
          platform: 'devto',
          username: 'Test Member',
        },
      ],
      organizations: [
        {
          id: '0dfaa9a0-d95a-4397-958e-4727189e3ef8',
          logo: 'https://placehold.co/400',
          displayName: 'Test Organization',
          memberOrganizations: {
            title: 'blabla',
            dateStart: new Date().toISOString(),
            dateEnd: new Date().toISOString(),
          },
        },
      ],
      tags: [
        {
          id: 'bced635d-acf7-4b68-a95d-872729e09d58',
          name: 'fake tag',
        },
      ],
      toMergeIds: ['3690742c-c5de-4d9a-aef8-1e3eaf57233d'],
      noMergeIds: ['b176d053-c53e-42d2-88d2-6fbc3e34184c'],

      attributes: {},
      manuallyCreated: false,
    }

    const prepared = MemberSyncService.prefixData(fakeMember, [])
    await this.openSearchService.index(
      `${InitService.FAKE_MEMBER_ID}-${InitService.FAKE_SEGMENT_ID}`,
      OpenSearchIndex.MEMBERS,
      prepared,
    )
  }

  private async createFakeActivity(): Promise<void> {
    // we need to create a fake activity to initialize the index with the proper data
    // it will be created in a nonexisting tenant so no one will see it ever
    // if we don't have anything in the index any search by any field will return an error

    const fakeActivity: IDbActivitySyncData = {
      id: InitService.FAKE_ACTIVITY_ID,
      tenantId: InitService.FAKE_TENANT_ID,
      segmentId: InitService.FAKE_SEGMENT_ID,
      memberId: InitService.FAKE_MEMBER_ID,
      type: 'comment',
      timestamp: new Date().toISOString(),
      platform: 'devto',
      isContribution: true,
      score: 10,
      sourceId: '123',
      sourceParentId: '456',
      attributes: {},
      channel: 'channel',
      body: 'body',
      title: 'title',
      url: 'https://placehold.co/400',
      sentiment: 10,
      importHash: 'importHash',
      conversationId: InitService.FAKE_CONVERSATION_ID,
      parentId: '6952eace-e083-4c53-a65c-f99848c47c1c',
      username: 'Test Member',
      objectMemberId: '4ea4c0f7-fdf8-448c-99ff-e03d0df95358',
      objectMemberUsername: 'Test Member2',
    }

    const prepared = ActivitySyncService.prefixData(fakeActivity)
    await this.openSearchService.index(
      InitService.FAKE_ACTIVITY_ID,
      OpenSearchIndex.ACTIVITIES,
      prepared,
    )
  }
}
