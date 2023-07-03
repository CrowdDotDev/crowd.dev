import { get } from 'lodash'
import GithubStrategy from 'passport-github2'
import { getServiceChildLogger } from '@crowd/logging'
import { GITHUB_CONFIG } from '../../../conf'
import { databaseInit } from '../../../database/databaseConnection'
import AuthService from '../authService'

const log = getServiceChildLogger('AuthSocial')

export function getGithubStrategy(): GithubStrategy {
  return new GithubStrategy(
    {
      clientID: GITHUB_CONFIG.clientId,
      clientSecret: GITHUB_CONFIG.clientSecret,
      callbackURL: GITHUB_CONFIG.callbackUrl,
    },
    (accessToken, refreshToken, profile, done) => {
      databaseInit()
        .then((database) => {
            console.log('profile', profile)
          const email = get(profile, 'emails[0].value')
          const displayName = get(profile, 'displayName')
          const { firstName, lastName } = splitFullName(displayName)

          return AuthService.signinFromSocial(
            'github',
            profile.id,
            email,
            true, // Github does not provide email verification in profile
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


// TODO: This is duplicated in googleStrategy.ts and should be moved to a common place
function splitFullName(fullName) {
    let firstName
    let lastName
  
    if (fullName && fullName.split(' ').length > 1) {
      const [firstNameArray, ...lastNameArray] = fullName.split(' ')
      firstName = firstNameArray
      lastName = lastNameArray.join(' ')
    } else {
      firstName = fullName || null
      lastName = null
    }
  
    return { firstName, lastName }
  }
