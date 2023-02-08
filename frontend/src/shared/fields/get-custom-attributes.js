import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'
import IntegerField from '@/shared/fields/integer-field'
import DateField from '@/shared/fields/date-field'
import MemberArrayAttributesField from '@/modules/member/member-array-attributes-field'

export default (customAttributes) => {
  return (
    Object.values(customAttributes)
      .filter((a) => {
        // Don't render special filters that do not have available options
        if (
          a.type === 'multiSelect' ||
          a.type === 'special'
        ) {
          return a.options.length && a.show
        }

        return a.show
      })
      .map((customAttribute) => {
        switch (customAttribute.type) {
          case 'boolean':
            return new BooleanField(
              customAttribute.name,
              customAttribute.label,
              { custom: customAttribute.canDelete }
            )
          case 'date':
            return new DateField(
              customAttribute.name,
              customAttribute.label,
              { custom: customAttribute.canDelete }
            )
          case 'number':
            return new IntegerField(
              customAttribute.name,
              customAttribute.label,
              { custom: customAttribute.canDelete }
            )

          case 'multiSelect':
          case 'special': {
            const options = customAttribute.options.map(
              (o) => ({
                value: o,
                label: o
              })
            )

            return new MemberArrayAttributesField(
              customAttribute.name,
              customAttribute.label,
              { options }
            )
          }
          default:
            return new StringField(
              customAttribute.name,
              customAttribute.label,
              { custom: customAttribute.canDelete }
            )
        }
      }) || []
  )
}
