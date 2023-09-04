import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesArrayRenderer from '@/modules/organization/components/organization-attributes-array-renderer.vue';

export default {
  name: 'directSubsidiaries',
  label: 'Direct Subsidiaries',
  type: attributesTypes.array,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesArrayRenderer,
};
