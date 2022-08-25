import isInvalid from '../isInvalid'

describe('Is invalid tests', () => {
  it('It should return valid when the result is correct', async () => {
    const result = {
      value: {
        followers: [1, 2, 3],
        nextPage: '',
      },
    }
    expect(isInvalid(result, 'followers')).toBe(false)
  })

  it('It should also work for other keys', async () => {
    const result = {
      value: {
        mentions: [1, 2, 3],
        nextPage: '',
      },
    }
    expect(isInvalid(result, 'mentions')).toBe(false)
  })

  it('It return invalid when no value also work for other keys', async () => {
    const result = {
      broken: true,
    }
    expect(isInvalid(result, 'mentions')).toBe(true)
  })

  it('It return invalid when no key', async () => {
    const result = {
      value: {
        broken: true,
      },
    }
    expect(isInvalid(result, 'mentions')).toBe(true)
  })

  it('It return invalid when wrong key', async () => {
    const result = {
      value: {
        mentions: [1, 2, 3],
        nextPage: '',
      },
    }
    expect(isInvalid(result, 'followers')).toBe(true)
  })

  it('It return valid when empty list', async () => {
    const result = {
      value: {
        mentions: [],
        nextPage: '',
      },
    }
    expect(isInvalid(result, 'mentions')).toBe(false)
  })
})
