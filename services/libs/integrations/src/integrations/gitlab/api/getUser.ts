import { Gitlab, UserSchema } from '@gitbeaker/rest'

export const getUser = async (api: InstanceType<typeof Gitlab>, userId: number) => {
  const user = await api.Users.show(userId)

  return user as UserSchema
}
