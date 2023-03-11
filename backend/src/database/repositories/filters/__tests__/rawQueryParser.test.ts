import MemberRepository from '../../memberRepository'
import RawQueryParser from '../rawQueryParser'

describe('RawQueryParser', () => {
  it('Should parse simple default filter', () => {
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
      params,
    )

    expect(result).toEqual(
      "((coalesce((m.attributes -> 'isOrganization' -> 'default')::boolean, false) <> :isOrganization_1) and (1=1))",
    )
    expect(params.isOrganization_1).toEqual(true)
  })

  it('Should parse simple default filter with multiple conditions', () => {
    const basicFilter = {
      and: [
        {
          isOrganization: {
            not: true,
          },
        },
        {
          isBot: {
            eq: true,
          },
        },
      ],
    }

    const params: any = {}

    const result = RawQueryParser.parseFilters(
      basicFilter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      params,
    )

    expect(result).toEqual(
      "((coalesce((m.attributes -> 'isOrganization' -> 'default')::boolean, false) <> :isOrganization_1) and (1=1))",
    )
    expect(params.isOrganization_1).toEqual(true)
  })
})
