alter table "requestedForErasureMemberIdentities" drop constraint "unique_anonymized_member";

alter table "requestedForErasureMemberIdentities" add constraint "unique_anonymized_member" unique ("memberId", "platform", "type", "value");