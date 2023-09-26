export interface User {
  acceptedTermsAndPrivacy: boolean;
  createdAt: string;
  createdById: string;
  deletedAt: string;
  email: string;
  emailVerificationToken: string;
  emailVerificationTokenExpiresAt: string;
  emailVerified: boolean;
  firstName: string;
  fullName: string;
  id: string;
  importHash: string;
  jwtTokenInvalidBefore: string;
  lastName: string;
  password: string;
  passwordResetToken: string;
  passwordResetTokenExpiresAt: string;
  phoneNumber: string;
  provider: string;
  providerId: string;
  tenants: Array<any>
  updatedAt: string;
  updatedById: string;
}
