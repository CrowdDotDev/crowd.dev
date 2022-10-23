import { computed } from 'vue'
import { useStore } from 'vuex'

const mapGetters = (namespace) => {
  const store = useStore()
  return Object.fromEntries(
    Object.keys(store.getters)
      .filter((getter) => getter.startsWith(namespace))
      .map((getter) => [
        getter.replace(`${namespace}/`, ''),
        computed(() => store.getters[getter])
      ])
  )
}

const mapMutations = (namespace) => {
  const store = useStore()
  return Object.fromEntries(
    Object.keys(store._mutations)
      .filter((getter) => getter.startsWith(namespace))
      .map((mutation) => [
        mutation.replace(`${namespace}/`, ''),
        (value) => store.commit(mutation, value)
      ])
  )
}

const mapActions = (namespace) => {
  const store = useStore()
  return Object.fromEntries(
    Object.keys(store._actions)
      .filter((action) => action.startsWith(namespace))
      .map((action) => [
        action.replace(`${namespace}/`, ''),
        (value) => store.dispatch(action, value)
      ])
  )
}

const mapState = (namespace) => {
  const store = useStore()
  return Object.fromEntries(
    Object.keys(store.state[namespace]).map((key) => [
      key,
      computed(() => store.state[namespace][key])
    ])
  )
}

export { mapGetters, mapActions, mapMutations, mapState }
