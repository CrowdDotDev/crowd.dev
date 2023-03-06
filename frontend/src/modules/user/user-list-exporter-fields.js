import { UserModel } from '@/modules/user/user-model'

const { fields } = UserModel

export default [
  fields.id,
  fields.email,
  fields.fullName,
  fields.phoneNumber,
  fields.avatars,
  fields.roles,
  fields.status,
  fields.createdAt
]
