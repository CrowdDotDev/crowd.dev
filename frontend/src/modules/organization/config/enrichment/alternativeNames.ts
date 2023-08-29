import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesArrayRenderer from '@/modules/organization/components/organization-attributes-array-renderer.vue';

export default {
  name: 'alternativeNames',
  label: 'Alternative Names',
  type: attributesTypes.array,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesArrayRenderer,
};
