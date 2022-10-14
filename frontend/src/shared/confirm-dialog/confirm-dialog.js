import { ElMessageBox } from 'element-plus'
import { h } from 'vue'

export default ({
  type = 'warning',
  title = 'Unsaved changes',
  message = 'Are you sure you want to leave this page? Unsaved changes will be lost',
  showCancelButton = true,
  showClose = false,
  customClass = 'confirm-dialog',
  cancelButtonText = 'Stay on this page',
  cancelButtonClass = 'btn btn--md btn--bordered',
  confirmButtonText = 'Discard',
  confirmButtonClass = 'btn btn--md btn--primary'
}) => {
  let iconClass = 'ri-error-warning-line'
  let iconColorClass = 'text-yellow-600'
  let iconBgColorClass = 'bg-yellow-100'

  if (type === 'error') {
    iconColorClass = 'text-red-600'
    iconBgColorClass = 'bg-red-100'
  }

  const MessageWithWarnignIcon = h(
    'div', // type
    {
      class: 'flex'
    }, // props
    [
      h(
        'span', // type
        {
          class: `rounded-full ${iconBgColorClass} w-10 h-10 flex items-center justify-center absolute custom-icon`
        }, // props
        [
          h(
            'i', // type
            {
              class: `${iconClass} text-lg ${iconColorClass} leading-none`
            }, // props
            []
          )
        ]
      ),
      h('p', {
        innerHTML: message,
        class: 'text-gray-500 text-sm'
      })
    ]
  )

  return ElMessageBox({
    title,
    message: MessageWithWarnignIcon,
    showCancelButton,
    showClose,
    customClass,
    cancelButtonText,
    cancelButtonClass,
    confirmButtonText,
    confirmButtonClass
  })
}
