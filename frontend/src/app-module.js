import Vue from 'vue'
import modules from '@/modules'
import plugins from '@/plugins'

const exists = (el) => Boolean(el)

/**
 * Initialize all the modules, mixins, filters, directives, and plugins of Vue application
 */
function setupComponentsFiltersDirectivesAndMixins() {
  Object.keys(modules)
    .map((key) => modules[key].components)
    .filter(exists)
    .forEach((components) => {
      Object.keys(components).forEach((name) => {
        Vue.component(name, components[name])
      })
    })

  Object.keys(modules)
    .map((key) => modules[key].filters)
    .filter(exists)
    .forEach((filters) => {
      filters.forEach((filter) => {
        Vue.filter(filter.name, filter.implementation)
      })
    })

  Object.keys(modules)
    .map((key) => modules[key].directives)
    .filter(exists)
    .forEach((directives) => {
      directives.forEach((directive) => {
        Vue.directive(
          directive.name,
          directive.implementation
        )
      })
    })

  Object.keys(modules)
    .map((key) => modules[key].mixins)
    .filter(exists)
    .forEach((mixins) => {
      mixins.forEach((mixin) => {
        Vue.mixin(mixin)
      })
    })

  Object.values(plugins).map((plugin) => {
    Vue.use(plugin)
  })
}

export { setupComponentsFiltersDirectivesAndMixins }
