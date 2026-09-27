import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import type { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';
import type { ReportDataType } from '@/shared/modules/report-issue/constants/report-data-type.enum';

interface ReportDataModalPayload {
  type?: ReportDataType;
  attribute?: ContributorIdentity | OrganizationIdentity | Organization | Contributor['segments'][number];
  contributor?: Contributor;
  organization?: Organization;
}

export const useSharedStore = defineStore('shared', () => {
  const reportDataModal = ref<ReportDataModalPayload | null>(null);

  function setReportDataModal(data: ReportDataModalPayload): void {
    reportDataModal.value = data;
  }

  return { reportDataModal, setReportDataModal };
});
