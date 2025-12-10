import { PlatformType } from '@crowd/types'

export enum MemberAttributeOpensearch {
  LOCATION = 'obj_location',
  AVATAR_URL = 'obj_avatarUrl',
  LANGUAGES = 'string_arr_languages',
  PROGRAMMING_LANGUAGES = 'string_arr_programmingLanguages',
  TIMEZONE = 'string_timezone',
}

export const EMAIL_AS_USERNAME_PLATFORMS = [
  PlatformType.GIT,
  PlatformType.JIRA,
  PlatformType.CONFLUENCE,
  PlatformType.GERRIT,
]
