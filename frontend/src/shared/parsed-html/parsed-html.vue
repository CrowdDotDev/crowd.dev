<template>
  <div v-html="parsedHtml" />
</template>

<script>
import { withHttp } from '@/utils/string'

export default {
  name: 'AppParsedHtml',
  props: {
    body: {
      type: String,
      required: true
    }
  },
  computed: {
    parsedHtml() {
      let parser = new DOMParser()
      const doc = parser.parseFromString(
        this.body,
        'text/html'
      )

      const links = doc.getElementsByTagName('a')

      ;[...links].forEach((link) => {
        link.setAttribute('target', '_blank')
        link.setAttribute(
          'href',
          withHttp(link.getAttribute('href'))
        )
        link.onclick = (e) => {
          e.stopPropagation()
        }
      })

      const html = this.$sanitize(doc.body.innerHTML)

      return html
    }
  },
  methods: {
    withHttp
  }
}
</script>
