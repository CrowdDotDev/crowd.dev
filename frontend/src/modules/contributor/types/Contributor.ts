import { Organization } from '@/modules/organization/types/Organization';
import { MergeAction } from '@/shared/modules/merge/types/MemberActions';

export interface ContributorAttribute {
  default: string;
  custom: string;
  github?: string;
  twitter?: string;
  hubspot?: any;
}

export interface ContributorContribution {
  firstCommitDate: string;
  id: number;
  lastCommitDate: string;
  numberCommits: number;
  summary: string;
  topics: string[];
  url: string;
}

export interface ContributorAffiliation {
  dateStart: string | null;
  dateEnd: string | null;
  organizationId: string;
  memberId: string;
  segmentId: string;
}

export interface ContributorReach {
  total: number;
  github: number;
  twitter: number;
}

export interface ContributorTag {
  id: string;
  name: string;
}

export interface ContributorIdentity {
  id: string;
  platform: string;
  type: string;
  value: string;
  verified: boolean;
  sourceId: string | null;
  integrationId?: string | null;
  // Computed properties
  platforms?: string[];
  url?: string;
}

export interface Contributor {
  activeDaysCount: string;
  activeOn: string[] | null;
  activityCount: string;
  activityTypes:string[] | null;
  attributes: Record<string, ContributorAttribute>
  averageSentiment: number | null;
  contributions: ContributorContribution[]
  createdAt: string;
  displayName: string;
  emails: string[]
  id: string;
  identities: ContributorIdentity[];
  importHash: string | null;
  joinedAt: string;
  lastActive: string | null;
  lastEnriched: string | null;
  noMergeIds: string[] | null;
  numberOfOpenSourceContributions: number | null;
  organizations: Organization[];
  reach:ContributorReach;
  score: number;
  tags: ContributorTag[];
  tenantId: string;
  toMergeIds: string[] | null;
  updatedAt: string;
  username: Record<string, string[]>
  verifiedEmails: string[];
  unverifiedEmails: string[];
  affiliations: ContributorAffiliation[];
  segments: {
    id: string;
    name: string;
    activityCount: string;
  }[],
  activitySycning: MergeAction | null;
}
