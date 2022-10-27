import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'
import IntegerField from '@/shared/fields/integer-field'
import DateField from '@/shared/fields/date-field'

export default (customAttributes) => {
  return (
    Object.values(customAttributes)
      .filter((a) => a.show)
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
