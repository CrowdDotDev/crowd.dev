alter table "requestedForErasureMemberIdentities" add column "memberId" uuid;

alter table "requestedForErasureMemberIdentities" add constraint "unique_anonymized_member" unique ("memberId", "platform", "type", "value");