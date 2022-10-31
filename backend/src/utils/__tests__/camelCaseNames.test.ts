import camelCaseNames from '../camelCaseNames'

describe('camelCaseNames tests', () => {
  it('Should return an empty string for an empty string input', async () => {
    expect(camelCaseNames('')).toBe('')
  })

  it('Should return lowercase string for a single word name', async () => {
    expect(camelCaseNames('SOMESTRING')).toBe('somestring')
  })

  it('Should return camelCase string for a multiple word name', async () => {
    expect(camelCaseNames('SOME VARIABLE NAME')).toBe('someVariableName')
  })

  it('Should return camelCase string for a multiple word name - non-alphanumeric characters should be stripped', async () => {
    expect(camelCaseNames("MEMBER'S ''##_$$ BIRTHDAY!!")).toBe('membersBirthday')
  })
})
