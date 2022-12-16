import { ElMessageBox } from 'element-plus'
import { h } from 'vue'

export default async ({
  type = 'info',
  title = 'Title',
  message = 'Message',
  customClass = 'information-dialog',
  confirmButtonText = 'Upgrade plan',
  confirmButtonClass = 'btn btn--md btn--primary w-full',
  icon = 'ri-error-warning-line'
}) => {
  let iconColorClass = 'text-yellow-600'
  let iconBgColorClass = 'bg-yellow-100'

  if (type === 'danger') {
    iconColorClass = 'text-red-600'
    iconBgColorClass = 'bg-red-100'
  } else if (type === 'info') {
    iconColorClass = 'text-gray-500'
    iconBgColorClass = 'bg-gray-100'
  } else if (type === 'success') {
    iconColorClass = 'text-green-500'
    iconBgColorClass = 'bg-green-100'
  }

  const content = h(
    'div', // type
    {
      class: 'flex flex-col'
    }, // props
    [
      h(
        'div',
        { class: 'flex justify-between items-center mb-4' },
        [
          h(
            'span', // type
            {
              class: `rounded-full ${iconBgColorClass} w-10 h-10 flex items-center justify-center custom-icon`
            }, // props
            [
              h(
                'i', // type
                {
                  class: `${icon} text-lg ${iconColorClass} leading-none`
                }, // props
                []
              )
            ]
          ),
          h(
            'button',
            {
              class:
                'btn btn--transparent btn--xs w-8 !h-8',
              type: 'button',
              onClick: () => {
                document
                  .querySelector(
                    '.el-message-box__headerbtn'
                  )
                  .dispatchEvent(new Event('click'))
              }
            },
            [
              h(
                'i', // type
                {
                  class: `text-lg ri-close-line leading-none`
                }, // props
                []
              )
            ]
          )
        ]
      ),
      h('h6', {
        innerHTML: title,
        class: 'text-black mb-3'
      }),

      h('p', {
        innerHTML: message,
        class: 'text-gray-500 text-sm'
      })
    ]
  )
  return ElMessageBox({
    title: '',
    message: content,
    showClose: true,
    showCancelButton: false,
    customClass,
    confirmButtonText,
    confirmButtonClass
  })
}
