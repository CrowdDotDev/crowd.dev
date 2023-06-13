import { MemberService } from '@/modules/member/member-service';
import { customAttributesService } from '@/shared/modules/filters/services/custom-attributes.service';
import { FilterCustomAttribute } from '@/shared/modules/filters/types/FilterCustomAttribute';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { MemberState } from '@/modules/member/store/pinia/state';
import { Pagination } from '@/shared/types/Pagination';
import { Member } from '@/modules/member/types/Member';

const { buildFilterFromAttributes } = customAttributesService();

export default {
  fetchMembers(this: MemberState, { body = {}, reload = false } :{ body?: any, reload?: boolean }): Promise<Pagination<Member>> {
    const mappedBody = reload ? this.savedFilterBody : body;
    this.selectedMembers = [];
    return MemberService.listMembers(mappedBody)
      .then((data: Pagination<Member>) => {
        this.members = data.rows;
        this.totalMembers = data.count;
        this.savedFilterBody = mappedBody;
        return Promise.resolve(data);
      })
      .catch((err) => {
        this.members = [];
        this.totalMembers = 0;
        return Promise.reject(err);
      });
  },
  getMemberCustomAttributes(this: MemberState): Promise<Record<string, FilterConfig>> {
    return (MemberService.fetchCustomAttributes() as any)
      .then(({ rows }: {rows: FilterCustomAttribute[]}) => {
        this.customAttributes = rows;
        this.customAttributesFilter = buildFilterFromAttributes(rows);
        return Promise.resolve(this.customAttributesFilter);
      });
  },
};
