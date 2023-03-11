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

    expect(result).toEqual(
      `((array(select jsonb_object_keys(m.username)) @> array[:identities_1, :identities_2]) and (1=1))`,
    )
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

    expect(result).toEqual(
      `((array(select jsonb_object_keys(m.username)) && array[:identities_1, :identities_2]) and (1=1))`,
    )
    expect(params.identities_1).toEqual('github')
    expect(params.identities_2).toEqual('slack')
  })

  it('Should parse filter with an in condition', () => {
    const filter = {
      and: [
        {
          email: {
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

    expect(result).toEqual(`((m.email in (:email_1, :email_2)) and (1=1))`)
    expect(params.email_1).toEqual('crash@crowd.dev')
    expect(params.email_2).toEqual('burn@crowd.dev')
  })
})
