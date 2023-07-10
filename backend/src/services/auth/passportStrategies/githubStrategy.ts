import { get } from 'lodash'
import GithubStrategy from 'passport-github2'
import { getServiceChildLogger } from '@crowd/logging'
import { GITHUB_CONFIG } from '../../../conf'
import { databaseInit } from '../../../database/databaseConnection'
import AuthService from '../authService'
import { splitFullName } from '../../../utils/splitName'
import { AuthProvider } from '../../../types/common'

const log = getServiceChildLogger('AuthSocial')

export function getGithubStrategy(): GithubStrategy {
  return new GithubStrategy(
    {
      clientID: GITHUB_CONFIG.clientId,
      clientSecret: GITHUB_CONFIG.clientSecret,
      callbackURL: GITHUB_CONFIG.callbackUrl,
      scope: ['user:email'], // Request email scope
    },
    (accessToken, refreshToken, profile, done) => {
      databaseInit()
        .then((database) => {
          const email = get(profile, 'emails[0].value')
          // GitHub user's profile doesn't include 'verified' field
          // However, GitHub accounts require email verification for activation
          const emailVerified = !!email
          const displayName = get(profile, 'displayName')
          const { firstName, lastName } = splitFullName(displayName)

          return AuthService.signinFromSocial(
            AuthProvider.GITHUB,
            profile.id,
            email,
            emailVerified,
            firstName,
            lastName,
            displayName,
            { database },
          )
        })
        .then((jwtToken) => {
          done(null, jwtToken)
        })
        .catch((error) => {
          log.error(error, 'Error while handling github auth!')
          done(error, null)
        })
    },
  )
}
