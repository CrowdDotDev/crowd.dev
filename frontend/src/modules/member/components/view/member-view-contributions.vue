<template>
  <div>
    <v-network-graph
      :nodes="nodes"
      :edges="edges"
      :configs="configs"
    />
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewContributions'
}
</script>

<script setup>
import * as vNG from 'v-network-graph'
import {
  ForceLayout
  //   ForceNodeDatum,
  //   ForceEdgeDatum,
} from 'v-network-graph/lib/force-layout'
import { computed, defineProps } from 'vue'

const props = defineProps({
  contributions: {
    type: Array,
    required: true
  }
})

const configs = vNG.defineConfigs({
  view: {
    layoutHandler: new ForceLayout({
      positionFixedByDrag: true,
      positionFixedByClickWithAltKey: true,
      // * The following are the default parameters for the simulation.
      // * You can customize it by uncommenting below.
      createSimulation: (d3, nodes, edges) => {
        const forceLink = d3
          .forceLink(edges)
          .id((d) => d.id)
        return d3
          .forceSimulation(nodes)
          .force('edge', forceLink.distance(100))
          .force('charge', d3.forceManyBody())
          .force(
            'collide',
            d3.forceCollide(50).strength(0.2)
          )
          .force('center', d3.forceCenter().strength(0.05))
          .alphaMin(0.001)
      }
    })
  },
  node: {
    selectable: true,
    normal: {
      type: 'circle',
      radius: (node) =>
        Math.min(Math.max(node.size, 4), 25),
      strokeWidth: 0,
      strokeColor: '#000000',
      strokeDasharray: '0',
      color: '#4466cc'
    },
    hover: {
      type: 'circle',
      radius: (node) => node.size + 2,
      strokeWidth: 0,
      strokeColor: '#000000',
      strokeDasharray: '0',
      color: '#dd2288'
    },
    selected: {
      type: 'circle',
      strokeWidth: 0,
      strokeColor: '#000000',
      strokeDasharray: '0',
      color: '#4466cc'
    },
    label: {
      visible: true,
      fontFamily: undefined,
      fontSize: 11,
      lineHeight: 1.1,
      color: '#000000',
      margin: 4,
      direction: 'south',
      background: {
        visible: false,
        color: '#ffffff',
        padding: {
          vertical: 1,
          horizontal: 4
        },
        borderRadius: 2
      }
    },
    focusring: {
      visible: true,
      width: 4,
      padding: 3,
      color: '#eebb00',
      dasharray: '0'
    }
  },
  edge: {
    selectable: true,
    normal: {
      width: 1,
      color: '#4466cc',
      dasharray: '0',
      linecap: 'butt',
      animate: false,
      animationSpeed: 50
    },
    hover: {
      width: 2,
      color: '#3355bb',
      dasharray: '0',
      linecap: 'butt',
      animate: false,
      animationSpeed: 50
    },
    selected: {
      width: 1,
      color: '#dd8800',
      dasharray: '6',
      linecap: 'round',
      animate: false,
      animationSpeed: 50
    },
    gap: 3,
    type: 'straight',
    summarize: true,
    summarized: {
      label: {
        fontSize: 10,
        color: '#4466cc'
      },
      shape: {
        type: 'rect',
        radius: 6, // for type is "circle"
        width: 12,
        height: 12,
        borderRadius: 3,
        color: '#ffffff',
        strokeWidth: 1,
        strokeColor: '#4466cc',
        strokeDasharray: '0'
      },
      stroke: {
        width: 5,
        color: '#4466cc',
        dasharray: '0',
        linecap: 'butt',
        animate: false,
        animationSpeed: 50
      }
    }
  }
})

// const openRepo = (url) => {
//   window.open(url, '_blank')
// }

const nodes = computed(() => {
  const nodes = {}
  props.contributions.forEach((contribution) => {
    const node = {
      name: contribution.url.split('/').pop(),
      //   id: contribution.id,
      //   label: contribution.url,
      size: contribution.numberCommits
      //   title: `Commits: ${
      //     contribution.numberCommits
      //   }\nTopics: ${contribution.topics.join(', ')}`,
      //   on: {
      //     click: () => {
      //       openRepo(contribution.github_url)
      //     }
      //   }
    }
    nodes[contribution.id.toString()] = node
  })
  console.log(nodes)
  return nodes
})
const edges = computed(() => {
  let edges = {}
  let topicMap = {}
  props.contributions.forEach((contribution) => {
    contribution.topics.forEach((topic) => {
      if (!topicMap[topic]) {
        topicMap[topic] = [contribution.id]
      } else {
        topicMap[topic].push(contribution.id)
      }
    })
  })
  for (let topic in topicMap) {
    let contributionIds = topicMap[topic]
    for (let i = 0; i < contributionIds.length; i++) {
      for (let j = i + 1; j < contributionIds.length; j++) {
        if (contributionIds[i] !== contributionIds[j]) {
          edges[topic] = {
            source: contributionIds[i].toString(),
            target: contributionIds[j].toString()
          }
        }
      }
    }
  }
  console.log(edges)
  return edges
})
</script>
