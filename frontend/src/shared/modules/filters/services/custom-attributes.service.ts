import { FilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { FilterCustomAttribute, FilterCustomAttributeType } from '@/shared/modules/filters/types/FilterCustomAttribute';
import {
  NumberFilterConfig,
  NumberFilterOptions,
  NumberFilterValue,
} from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  BooleanFilterConfig, BooleanFilterOptions,
  BooleanFilterValue,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import {
  DateFilterConfig,
  DateFilterOptions,
  DateFilterValue,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import {
  MultiSelectFilterConfig, MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import {
  StringFilterConfig,
  StringFilterOptions,
  StringFilterValue,
} from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';

export const customAttributesService = () => {
  function buildFilterFromAttributes(
    attributes: FilterCustomAttribute[],
  ): Record<string, FilterConfig> {
    const filters: Record<string, FilterConfig> = {};
    attributes
      .filter((attribute) => attribute.show)
      .forEach((attribute) => {
        // Number type
        if (attribute.type === FilterCustomAttributeType.NUMBER) {
          filters[attribute.name] = {
            id: attribute.name,
            label: attribute.label,
            iconClass: 'ri-hashtag',
            type: FilterConfigType.NUMBER,
            options: {
              hideIncludeSwitch: true,
            },
            itemLabelRenderer(value: NumberFilterValue, options: NumberFilterOptions): string {
              return itemLabelRendererByType[FilterConfigType.NUMBER](attribute.label, value, options);
            },
            apiFilterRenderer(value: NumberFilterValue): any[] {
              return apiFilterRendererByType[FilterConfigType.NUMBER](`attributes.${attribute.name}.default`, value);
            },
          } as NumberFilterConfig;
          return;
        }
        // Boolean type
        if (attribute.type === FilterCustomAttributeType.BOOLEAN) {
          filters[attribute.name] = {
            id: attribute.name,
            label: attribute.label,
            iconClass: 'ri-toggle-line',
            type: FilterConfigType.BOOLEAN,
            options: {
              hideIncludeSwitch: true,
            },
            itemLabelRenderer(value: BooleanFilterValue, options: BooleanFilterOptions): string {
              return itemLabelRendererByType[FilterConfigType.BOOLEAN](attribute.label, value, options);
            },
            apiFilterRenderer(value: BooleanFilterValue): any[] {
              return apiFilterRendererByType[FilterConfigType.BOOLEAN](`attributes.${attribute.name}.default`, value);
            },
          } as BooleanFilterConfig;
          return;
        }
        // String type
        if (attribute.type === FilterCustomAttributeType.STRING || attribute.type === FilterCustomAttributeType.URL) {
          filters[attribute.name] = {
            id: attribute.name,
            label: attribute.label,
            iconClass: 'ri-menu-2-line',
            type: FilterConfigType.STRING,
            options: {
              hideIncludeSwitch: true,
            },
            itemLabelRenderer(value: StringFilterValue, options: StringFilterOptions): string {
              return itemLabelRendererByType[FilterConfigType.STRING](attribute.label, value, options);
            },
            apiFilterRenderer(value: StringFilterValue): any[] {
              return apiFilterRendererByType[FilterConfigType.STRING](`attributes.${attribute.name}.default`, value);
            },
          } as StringFilterConfig;
          return;
        }
        // Date type
        if (attribute.type === FilterCustomAttributeType.DATE) {
          filters[attribute.name] = {
            id: attribute.name,
            label: attribute.label,
            iconClass: 'ri-calendar-2-line',
            type: FilterConfigType.DATE,
            options: {
              hideIncludeSwitch: true,
            },
            itemLabelRenderer(value: DateFilterValue, options: DateFilterOptions): string {
              return itemLabelRendererByType[FilterConfigType.DATE](attribute.label, value, options);
            },
            apiFilterRenderer(value: DateFilterValue): any[] {
              return apiFilterRendererByType[FilterConfigType.DATE](`attributes.${attribute.name}.default`, value);
            },
          } as DateFilterConfig;
          return;
        }
        // Multiselect type
        if (attribute.type === FilterCustomAttributeType.MULTISELECT
          || (attribute.type === FilterCustomAttributeType.SPECIAL && attribute.options.length > 0)) {
          filters[attribute.name] = {
            id: attribute.name,
            label: attribute.label,
            iconClass: 'ri-list-unordered',
            type: FilterConfigType.MULTISELECT,
            options: {
              hideIncludeSwitch: true,
              options: [
                {
                  options: attribute.options.map((option) => ({
                    value: option,
                    label: option,
                  })),
                },
              ],
            },
            itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
              return itemLabelRendererByType[FilterConfigType.MULTISELECT](attribute.label, value, options);
            },
            apiFilterRenderer(value: MultiSelectFilterValue): any[] {
              return apiFilterRendererByType[FilterConfigType.MULTISELECT](`attributes.${attribute.name}.default`, value);
            },
          } as MultiSelectFilterConfig;
        }
      });
    return filters;
  }

  return {
    buildFilterFromAttributes,
  };
};
