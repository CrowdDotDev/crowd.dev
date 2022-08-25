import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class SettingsService {
  static applyThemeFromTenant() {
    const currentSettings = AuthCurrentTenant.getSettings()

    if (currentSettings) {
      return this.applyTheme(currentSettings.theme)
    }

    this.applyTheme('default')
  }

  static async find() {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings`
    )

    return response.data
  }

  static async save(settings) {
    const body = {
      settings
    }

    const tenantId = AuthCurrentTenant.get()
    const response = await authAxios.put(
      `/tenant/${tenantId}/settings`,
      body
    )
    return response.data
  }

  static applyTheme(color) {
    const oldLink = document.getElementById('theme-link')

    if (oldLink) {
      oldLink.setAttribute(
        'href',
        `${process.env.BASE_URL}theme/${color}.css`
      )
      return
    }

    const link = document.createElement('link')
    link.setAttribute('id', 'theme-link')
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('type', 'text/css')
    link.setAttribute(
      'href',
      `${process.env.BASE_URL}theme/${color}.css`
    )

    const head = document
      .getElementsByTagName('head')
      .item(0)

    if (!head) {
      return
    }

    head.prepend(link)
  }
}
