import { MemberService } from '@/modules/member/member-service';
import { customAttributesService } from '@/shared/modules/filters/services/custom-attributes.service';
import { FilterCustomAttribute } from '@/shared/modules/filters/types/FilterCustomAttribute';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { MemberState } from '@/modules/member/store/pinia/state';

const { buildFilterFromAttributes } = customAttributesService();

export default {
  getMemberCustomAttributes(this: MemberState): Promise<Record<string, FilterConfig>> {
    return MemberService.fetchCustomAttributes()
      .then(({ rows }: {rows: FilterCustomAttribute[]}) => {
        this.customAttributes = buildFilterFromAttributes(rows);
        return Promise.resolve(this.customAttributes);
      });
  },
};
