import { ElMessageBox } from 'element-plus'
import { h } from 'vue'

// TODO: Make dialog dynamic on the icon
export default (
  {
    title,
    message,
    showCancelButton,
    showClose,
    customClass,
    cancelButtonText,
    cancelButtonClass,
    confirmButtonText,
    confirmButtonClass
  } = {
    title: 'Unsaved changes',
    message:
      'Are you sure you want to leave this page? Unsaved changes will be lost',
    showCancelButton: true,
    showClose: false,
    customClass: 'confirm-dialog',
    cancelButtonText: 'Stay on this page',
    cancelButtonClass: 'btn btn--md btn--bordered',
    confirmButtonText: 'Discard',
    confirmButtonClass: 'btn btn--md btn--primary'
  }
) => {
  const MessageWithWarnignIcon = h(
    'div', // type
    {
      class: 'flex'
    }, // props
    [
      h(
        'span', // type
        {
          class:
            'rounded-full bg-yellow-100 w-10 h-10 flex items-center justify-center absolute custom-icon'
        }, // props
        [
          h(
            'i', // type
            {
              class:
                'ri-error-warning-line text-lg text-yellow-600 leading-none'
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
