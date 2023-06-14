import { MemberAttributeType } from '@crowd/types'
import MemberRepository from '../../memberRepository'
import RawQueryParser from '../rawQueryParser'

describe('RawQueryParser', () => {
  it('Should parse simple filter with an empty second operand', () => {
    const basicFilter = {
      and: [
        {
          isOrganization: {
            not: true,
          },
        },
        {},
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      basicFilter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(
      "((coalesce((m.attributes -> 'isOrganization' -> 'default')::boolean, false) <> :isOrganization_1) and (1=1))",
    )
    expect(params.isOrganization_1).toEqual(true)
  })

  it('Should parse simple default filter', () => {
    const basicFilter = {
      and: [
        {
          isOrganization: {
            not: true,
          },
        },
        {
          isBot: {
            eq: false,
          },
        },
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      basicFilter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(
      "((coalesce((m.attributes -> 'isOrganization' -> 'default')::boolean, false) <> :isOrganization_1) and (coalesce((m.attributes -> 'isBot' -> 'default')::boolean, false) = :isBot_1))",
    )
    expect(params.isOrganization_1).toEqual(true)
    expect(params.isBot_1).toEqual(false)
  })

  it('Should parse filter with a between condition', () => {
    const filter = {
      and: [
        {
          activityCount: {
            between: [10, 100],
          },
        },
        {},
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(
      `((aggs."activityCount" between :activityCount_1 and :activityCount_2) and (1=1))`,
    )
    expect(params.activityCount_1).toEqual(10)
    expect(params.activityCount_2).toEqual(100)
  })

  it('Should parse filter with a contains condition', () => {
    const filter = {
      and: [
        {
          identities: {
            contains: ['github', 'slack'],
          },
        },
        {},
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(`((aggs.identities @> array[:identities_1, :identities_2]) and (1=1))`)
    expect(params.identities_1).toEqual('github')
    expect(params.identities_2).toEqual('slack')
  })

  it('Should parse filter with an overlap condition', () => {
    const filter = {
      and: [
        {
          identities: {
            overlap: ['github', 'slack'],
          },
        },
        {},
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(`((aggs.identities && array[:identities_1, :identities_2]) and (1=1))`)
    expect(params.identities_1).toEqual('github')
    expect(params.identities_2).toEqual('slack')
  })

  it('Should parse filter with an in condition', () => {
    const filter = {
      and: [
        {
          emails: {
            in: ['crash@crowd.dev', 'burn@crowd.dev'],
          },
        },
        {},
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(`((m.emails in (:emails_1, :emails_2)) and (1=1))`)
    expect(params.emails_1).toEqual('crash@crowd.dev')
    expect(params.emails_2).toEqual('burn@crowd.dev')
  })

  it('Should parse filter with attribute column multiselect filter', () => {
    const filter = {
      and: [
        {
          'attributes.skills.default': {
            contains: ['javascript', 'typescript'],
          },
        },
        {},
      ],
    }

    const params: any = {}
    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [
        {
          property: 'attributes',
          column: 'm.attributes',
          attributeInfos: [
            {
              name: 'skills',
              type: MemberAttributeType.MULTI_SELECT,
            },
          ],
        },
      ],
      params,
    )

    expect(result).toEqual(
      `(((m.attributes -> 'skills' -> 'default') ?& array[:attributes_skills_default_1, :attributes_skills_default_2]) and (1=1))`,
    )
    expect(params.attributes_skills_default_1).toEqual('javascript')
    expect(params.attributes_skills_default_2).toEqual('typescript')
  })

  it('Should parse filter with attribute column number filter', () => {
    const filter = {
      and: [
        {
          'attributes.age.default': {
            between: [20, 30],
          },
        },
        {},
      ],
    }

    const params: any = {}
    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [
        {
          property: 'attributes',
          column: 'm.attributes',
          attributeInfos: [
            {
              name: 'age',
              type: MemberAttributeType.NUMBER,
            },
          ],
        },
      ],
      params,
    )

    expect(result).toEqual(
      `(((m.attributes -> 'age' -> 'default')::integer between :attributes_age_default_1 and :attributes_age_default_2) and (1=1))`,
    )
    expect(params.attributes_age_default_1).toEqual(20)
    expect(params.attributes_age_default_2).toEqual(30)
  })

  it('Should parse filter with json column array filter', () => {
    const filter = {
      and: [
        {
          tags: ['c194036e-cf7c-4353-ae16-e8572a208f51'],
        },
        {},
      ],
    }

    const params: any = {}
    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [
        {
          property: 'tags',
          column: 'mt.all_ids',
          attributeInfos: [],
        },
      ],
      params,
    )

    expect(result).toEqual(`(((mt.all_ids) ?& array[:tags_1]) and (1=1))`)
    expect(params.tags_1).toEqual('c194036e-cf7c-4353-ae16-e8572a208f51')
  })

  it('Should parse filter with not operator', () => {
    const filter = {
      and: [
        {
          not: {
            displayName: {
              textContains: 'test',
            },
          },
        },
        {},
      ],
    }

    const params: any = {}
    const result = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    expect(result).toEqual(`((not (m."displayName" ilike :displayName_1)) and (1=1))`)
    expect(params.displayName_1).toEqual('%test%')
  })
})
