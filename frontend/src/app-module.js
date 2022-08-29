import modules from '@/modules'
import plugins from '@/plugins'

const exists = (el) => Boolean(el)

/**
 * Initialize all the modules, mixins, filters, directives, and plugins of Vue application
 */
function setupComponentsFiltersDirectivesAndMixins(app) {
  Object.keys(modules)
    .map((key) => modules[key].components)
    .filter(exists)
    .forEach((components) => {
      Object.keys(components).forEach((name) => {
        app.component(name, components[name])
      })
    })

  Object.keys(modules)
    .map((key) => modules[key].filters)
    .filter(exists)
    .forEach((filters) => {
      filters.forEach((filter) => {
        app.filter(filter.name, filter.implementation)
      })
    })

  Object.keys(modules)
    .map((key) => modules[key].directives)
    .filter(exists)
    .forEach((directives) => {
      directives.forEach((directive) => {
        app.directive(
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
        app.mixin(mixin)
      })
    })

  Object.values(plugins).map((plugin) => {
    app.use(plugin)
  })
}

export { setupComponentsFiltersDirectivesAndMixins }
