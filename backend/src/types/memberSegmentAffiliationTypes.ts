export interface MemberSegmentAffiliationBase {
  memberId: string
  segmentId: string
  organizationId: string
}

export interface MemberSegmentAffiliationCreate extends MemberSegmentAffiliationBase {}

export interface MemberSegmentAffiliationUpdate {
  organizationId: string
}

export interface MemberSegmentAffiliation extends MemberSegmentAffiliationBase {
  id: string
}

export interface MemberSegmentAffiliationJoined extends MemberSegmentAffiliationBase {
  id?: string
  organizationName: string
  organizationLogo: string
  segmentSlug: string
  segmentName: string
  segmentParentName: string
}
