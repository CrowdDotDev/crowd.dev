<template>
  <div class="panel contributions-panel relative h-80">
    <div class="p-4 flex justify-between">
      <h6 class="flex align-center">
        <i class="ri-github-fill text-lg pr-1"></i>
        OSS contributions
      </h6>
      <div class="text-gray-500 flex align-center text-sm">
        <i
          class="ri-checkbox-blank-circle-fill text-gray-200 pr-2"
        ></i>
        <span class="pr-4"> Repository </span>
        <span class="font-medium text-brand-200 pr-2">
          —
        </span>
        <span> Topics </span>
      </div>
    </div>
    <div class="background-dotted rounded-lg h-64">
      <v-network-graph
        ref="graph"
        v-model:layouts="layouts"
        :nodes="nodes"
        :edges="edges"
        :configs="configs"
        :event-handlers="eventHandlers"
      />
      <!-- Tooltip -->
      <div
        ref="tooltip"
        class="tooltip"
        :style="{ ...tooltipPos, opacity: tooltipOpacity }"
      >
        <div class="section">
          <p class="key">Repository</p>
          <h6>{{ nodes[targetNodeId]?.name ?? '' }}</h6>
        </div>
        <div class="section">
          <p class="key">Contributions</p>
          <p class="text-sm text-gray-900">
            {{ nodes[targetNodeId]?.numberCommits ?? '' }}
          </p>
        </div>
        <div class="section">
          <p class="key">Topics</p>
          <div class="flex flex-wrap">
            <div
              v-for="topic in nodes[
                targetNodeId
              ]?.topics.slice(0, 5) ?? []"
              :key="topic"
              class="topic"
            >
              {{ topic }}
            </div>

            <div
              v-if="nodes[targetNodeId]?.topics.length > 5"
              class="topic"
            >
              +{{ nodes[targetNodeId]?.topics.length - 5 }}
            </div>
          </div>
        </div>
        <div class="w-full text-center pt-3">
          <button>Click to open on GitHub</button>
        </div>
      </div>
      <div
        ref="edgeTooltip"
        class="edge-tooltip"
        :style="{
          ...edgeToolTipPos,
          opacity: edgeToolTipOpacity
        }"
      >
        <div class="text-xs">
          <span class="font-medium">
            {{
              `${edges[targetEdgeId]?.label.key ?? ''}`
            }}: </span
          >{{ `${edges[targetEdgeId]?.label.value ?? ''}` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
  reactive,
  defineProps
} from 'vue'
import { defineConfigs } from 'v-network-graph'
import { ForceLayout } from 'v-network-graph/lib/force-layout'

const props = defineProps({
  contributions: {
    type: Array,
    required: true
  }
})

const maxSize = 40
const minSize = 10
const reduceFactor = ref(1)

// ref="graph"
const graph = ref()
// ref="tooltip"
const tooltip = ref()
const edgeTooltip = ref()
const targetNodeId = ref('')
const EDGE_MARGIN_TOP = 2
const targetEdgeId = ref('')
const hoveredNode = ref(null)
const layouts = ref({})

const tooltipOpacity = ref(0) // 0 or 1
const tooltipPos = ref({ left: '0px', top: '0px' })

const edgeToolTipOpacity = ref(0) // 0 or 1
const edgeToolTipPos = ref({ left: '0px', top: '0px' })

const configs = reactive(
  defineConfigs({
    view: {
      layoutHandler: new ForceLayout({
        positionFixedByDrag: false,
        positionFixedByClickWithAltKey: true,
        // * The following are the default parameters for the simulation.
        // * You can customize it by uncommenting below.
        createSimulation: (d3, nodes, edges) => {
          const forceLink = d3
            .forceLink(edges)
            .id((d) => d.id)
          return d3
            .forceSimulation(nodes)
            .force('edge', forceLink.distance(140))
            .force(
              'charge',
              d3.forceManyBody().strength(20)
            )
            .force(
              'collide',
              d3.forceCollide(40).strength(0.1)
            )
            .force('center', d3.forceCenter().strength(0.1))
            .alphaMin(0.001)
        }
      })
    },
    node: {
      label: {
        visible: true
      },
      normal: {
        radius: (node) => node.size,
        color: nodeColor,
        strokeWidth: 3,
        strokeColor: '#FFFFFF'
      },
      hover: {
        radius: (node) => node.size,
        color: nodeColor,
        strokeWidth: 3,
        strokeColor: '#FFFFFF'
      }
    },
    edge: {
      normal: {
        color: '#F6B9AB',
        width: 0.5
      },
      hover: {
        color: '#E94F2E',
        width: 3
      }
    }
  })
)

const nodes = computed(() => {
  const nodes = {}
  props.contributions.forEach((contribution) => {
    const name = contribution.url.split('/').pop()
    if (!nodes[name]) {
      const node = {
        name,
        size:
          Math.max(
            Math.min(contribution.numberCommits, maxSize),
            minSize
          ) * reduceFactor.value,
        topics: contribution.topics,
        numberCommits: contribution.numberCommits,
        url: contribution.url
      }
      nodes[name] = node
    } else {
      nodes[name].size =
        Math.max(
          Math.min(
            nodes[name].numberCommits +
              contribution.numberCommits,
            maxSize
          ),
          minSize
        ) * reduceFactor.value
      nodes[name].numberCommits +=
        contribution.numberCommits
      nodes[name].topics = [
        ...new Set([
          ...nodes[name].topics,
          ...contribution.topics
        ])
      ]
    }
  })
  return nodes
})

const edges = computed(() => {
  let edges = {}
  let topicMap = {}
  props.contributions.forEach((contribution) => {
    const name = contribution.url.split('/').pop()
    contribution.topics.forEach((topic) => {
      if (!topicMap[topic]) {
        topicMap[topic] = [name]
      } else {
        topicMap[topic].push(name)
      }
    })
  })

  for (let topic in topicMap) {
    let contributionIds = topicMap[topic]
    for (let i = 0; i < contributionIds.length; i++) {
      for (let j = i + 1; j < contributionIds.length; j++) {
        const id = `${contributionIds[i]}-${contributionIds[j]}`
        const reverseId = `${contributionIds[j]}-${contributionIds[i]}`
        if (
          contributionIds[i] !== contributionIds[j] &&
          !edges[id] &&
          !edges[reverseId]
        ) {
          edges[id] = {
            source: contributionIds[i].toString(),
            target: contributionIds[j].toString(),
            topics: [topic],
            label: {
              key: 'Topic',
              value: topic
            }
          }
        } else {
          if (edges[id]) {
            edges[id].topics.push(topic)
            let label

            if (edges[id].topics.length === 2) {
              label = {
                key: 'Topics',
                value: edges[id].topics.join(', ')
              }
            } else {
              label = {
                key: 'Topics',
                value: `${edges[id].topics
                  .slice(0, 3)
                  .join(', ')}...`
              }
            }
            edges[id].label = label
          }
        }
      }
    }
  }
  return edges
})

const edgeCenterPos = computed(() => {
  const edge = edges.value[targetEdgeId.value]
  if (!edge) return { x: 0, y: 0 }

  const sourceNode = edges.value[targetEdgeId.value].source
  const targetNode = edges.value[targetEdgeId.value].target

  return {
    x:
      (layouts.value.nodes[sourceNode].x +
        layouts.value.nodes[targetNode].x) /
      2,
    y:
      (layouts.value.nodes[sourceNode].y +
        layouts.value.nodes[targetNode].y) /
      2
  }
})

function nodeColor(node) {
  if (!hoveredNode.value) return '#E5E7EB'
  return node.name === hoveredNode.value
    ? '#E5E7EB'
    : '#F3F4F6'
}

const targetNodePos = computed(() => {
  const nodePos = layouts.value.nodes[targetNodeId.value]
  return nodePos || { x: 0, y: 0 }
})

const targetNodeRadius = computed(() => {
  const node = nodes.value[targetNodeId.value]
  return node?.size
})

// Update `tooltipPos`
watch(
  () => [targetNodePos.value, tooltipOpacity.value],
  () => {
    if (!graph.value || !tooltip.value) return

    // translate coordinates: SVG -> DOM
    const domPoint =
      graph.value.translateFromSvgToDomCoordinates(
        targetNodePos.value
      )

    console.log('domPoint', domPoint.y)
    console.log('targetNodeRadius', targetNodeRadius.value)
    console.log('tooltip', tooltip.value.offsetHeight)
    console.log(
      domPoint.y -
        targetNodeRadius.value -
        tooltip.value.offsetHeight
    )
    tooltipPos.value = {
      left:
        domPoint.x -
        tooltip.value.offsetWidth / 2 +
        // left +
        'px',
      top: domPoint.y - targetNodeRadius.value - 300 + 'px'
    }

    // console.log(tooltipPos.value)
  },
  { deep: true }
)

watch(
  () => [edgeCenterPos.value, edgeToolTipOpacity.value],
  () => {
    if (!graph.value || !edgeTooltip.value)
      return { x: 0, y: 0 }
    if (!targetEdgeId.value) return { x: 0, y: 0 }

    // translate coordinates: SVG -> DOM
    const domPoint =
      graph.value.translateFromSvgToDomCoordinates(
        edgeCenterPos.value
      )
    // calculates top-left position of the tooltip.
    edgeToolTipPos.value = {
      left:
        domPoint.x -
        edgeTooltip.value.offsetWidth / 2 +
        'px',
      top:
        domPoint.y -
        EDGE_MARGIN_TOP -
        edgeTooltip.value.offsetHeight -
        10 +
        'px'
    }
  },
  { deep: true }
)

const eventHandlers = {
  'node:click': ({ node }) => {
    targetNodeId.value = node
    tooltipOpacity.value = 1 // show
    hoveredNode.value = nodes.value[node].name
  },
  'view:click': () => {
    targetNodeId.value = ''
    tooltipOpacity.value = 0 // hide
    hoveredNode.value = null
  },
  'node:pointerover': ({ node }) => {
    hoveredNode.value = nodes.value[node].name
  },
  'node:pointerout': () => {
    hoveredNode.value = null
  },
  'edge:pointerover': ({ edge }) => {
    targetEdgeId.value = edge ?? ''
    edgeToolTipOpacity.value = 1 // show
  },
  'edge:pointerout': () => {
    targetEdgeId.value = ''
    edgeToolTipOpacity.value = 0 // hide
  },
  'view:zoom'(zoom) {
    if (zoom < 0.7) {
      configs.node.label.visible = false
    } else {
      configs.node.label.visible = true
    }
    if (zoom < 1) {
      reduceFactor.value = zoom
    }
  }
}
</script>

<style lang="css" scoped>
.tooltip {
  top: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  pointer-events: none;
  z-index: 100000000;
  @apply bg-white shadow-lg rounded-lg p-4 cursor-auto h-80 w-60 overflow-hidden;
}

.edge-tooltip {
  top: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  pointer-events: none;
  z-index: 100000000;
  @apply bg-gray-900 text-white text-sm shadow-lg rounded-lg p-1 cursor-auto;
}

.background-dotted {
  background: white;
  background-image: radial-gradient(
    #d4d4d4 1px,
    transparent 0
  );
  background-size: 20px 20px;
  background-position: -19px -19px;
}

.contributions-panel {
  padding: 0 !important;
  overflow: visible !important;
}

.section {
  @apply pb-2 border-b border-gray-200;
}

.key {
  @apply text-gray-400 text-xs font-medium py-2;
}

.topic {
  @apply border border-gray-200 text-gray-900 rounded-lg px-2 py-1 text-xs mr-2 mb-2;
}
</style>
