import authAxios from '@/shared/axios/auth-axios';

interface InvitationLink {
  invitationUrl: string;
  emailDomain: string;
  defaultRole: string;
  expiresAt: string;
}

interface InvitationValidation {
  valid: boolean;
  emailDomain: string;
  defaultRole: string;
}

interface SignupData {
  invitationToken: string;
  email: string;
  password: string;
  fullName: string;
}

interface SignupResponse {
  token: string;
  user: any;
}

export class InvitationLinkService {
  /**
   * Generates a workspace invitation link
   */
  static async generateInvitationLink(defaultRole: string = 'readonly'): Promise<InvitationLink> {
    const response = await authAxios.post('/tenant/invitation-link', {
      defaultRole,
    });

    return response.data;
  }

  /**
   * Validates an invitation link token and email
   */
  static async validateInvitationLink(invitationToken: string, email?: string): Promise<InvitationValidation> {
    const response = await authAxios.post(`/tenant/invitation/${invitationToken}/validate`, {
      email,
    });

    return response.data;
  }

  /**
   * Signs up a user via invitation link
   */
  static async signupViaInvitationLink(userData: SignupData): Promise<SignupResponse> {
    const response = await authAxios.post(`/auth/invitation/${userData.invitationToken}/sign-up`, userData);

    return response.data;
  }
}