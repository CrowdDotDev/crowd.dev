import { getCleanString } from '@crowd/common'

describe('getCleanString method', () => {
  it('Should clean a string with non alphanumeric characters', async () => {
    const cleanedString = getCleanString('!@#$%^&*()_+abc    !@#$%123')
    expect(cleanedString).toStrictEqual('abc 123')
  })

  it('Should return an empty string when an empty string is given', async () => {
    const cleanedString = getCleanString('')
    expect(cleanedString).toStrictEqual('')
  })

  it('Should return an empty string when no alphanumeric characters exist', async () => {
    const cleanedString = getCleanString('ß!@#$%     ^&*()_+-')
    expect(cleanedString).toStrictEqual('')
  })
})
