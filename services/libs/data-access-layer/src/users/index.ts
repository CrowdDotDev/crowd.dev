import { QueryExecutor } from '../queryExecutor'
import { QueryResult, queryTableById } from '../utils'

export enum UserField {
  // meta
  ID = 'id',
  FULL_NAME = 'fullName',
  FIRST_NAME = 'firstName',
  PASSWORD = 'password',
  EMAIL_VERIFIED = 'emailVerified',
  EMIL_VERIFICATION_TOKEN = 'emailVerificationToken',
  EMAIL_VERIFICATION_TOKEN_EXPIRES_AT = 'emailVerificationTokenExpiresAt',
  PROVIDER = 'provider',
  PROVIDER_ID = 'providerId',
  PASSWORD_RESET_TOKEN = 'passwordResetToken',
  PASSWORD_RESET_TOKEN_EXPIRES_AT = 'passwordResetTokenExpiresAt',
  LAST_NAME = 'lastName',
  PHONE_NUMBER = 'phoneNumber',
  EMAIL = 'email',
  JWT_TOKEN_INVALID_BEFORE = 'jwtTokenInvalidBefore',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',
  CREATED_BY_ID = 'createdById',
  UPDATED_BY_ID = 'updatedById',
  ACCEPTED_TERMS_AND_PRIVACY = 'acceptedTermsAndPrivacy',
}

export async function findUserById<T extends UserField>(
  qx: QueryExecutor,
  userId: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'users', Object.values(UserField), userId, fields)
}
