import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import { router } from '@/router'

export default async (title, message) => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title,
      message,
      confirmButtonText: 'Go to Plans & Pricing',
      cancelButtonText: 'Dismiss',
      icon: 'ri-error-warning-line'
    })
    router.push('/settings?activeTab=plans')
  } catch (e) {
    // do nothing
  }
}
