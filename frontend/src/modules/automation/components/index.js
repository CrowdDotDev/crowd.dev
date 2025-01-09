export function getTriggerMessage(automationTrigger) {
  switch (automationTrigger) {
    case 'new_activity':
      return 'New activity happened in your community';
    case 'new_member':
      return 'New person joined your community';
    case 'member_attributes_match':
      return 'Person attributes match condition(s)';
    case 'organization_attributes_match':
      return 'Organization attributes match condition(s)';
    default:
      return '';
  }
}
