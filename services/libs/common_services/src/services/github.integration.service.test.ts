import { describe, expect, it } from 'vitest'

import {
  chooseProjectDescription,
  isNoRepositoryAccessDescription,
} from './github.integration.service'

describe('isNoRepositoryAccessDescription', () => {
  it.each([
    "ALIS is a project developed by the fallintodusk organization. Without access to the repository's README, code, or metadata, the specific functionality cannot be determined from the project name alone.",
    'The purpose of this project cannot be determined.',
    'The repository could not be accessed.',
    'I could not access the README.',
    "I couldn't access the repository.",
    'I cannot access the repository README.',
    'The model was unable to access the code.',
    '',
    null,
    undefined,
  ])('flags %j', (description) => {
    expect(isNoRepositoryAccessDescription(description)).toBe(true)
  })

  it.each([
    'Open-source Unreal Engine 5 world-generation framework and survival-game prototype.',
    'A sync tool that lets teams keep working without access to the internet.',
    'A library for reading and writing access control lists.',
  ])('keeps %j', (description) => {
    expect(isNoRepositoryAccessDescription(description)).toBe(false)
  })
})

describe('chooseProjectDescription', () => {
  const fallback = "Without access to the repository's README, nothing more can be said."

  it('keeps a real LLM description', () => {
    expect(chooseProjectDescription('A world-generation framework.', 'GitHub text')).toBe(
      'A world-generation framework.',
    )
  })

  it('uses the GitHub description when the LLM could not access the repository', () => {
    expect(chooseProjectDescription(fallback, 'GitHub text')).toBe('GitHub text')
  })

  it('saves an empty description rather than the failure text when GitHub has none', () => {
    expect(chooseProjectDescription(fallback, null)).toBe('')
  })
})
