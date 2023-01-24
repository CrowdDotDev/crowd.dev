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
        :class="{
          'pointer-events-none': targetNodeId === ''
        }"
        :style="{ ...tooltipPos, opacity: tooltipOpacity }"
      >
        <div class="section border-b">
          <p class="key">Repository</p>
          <h6>{{ nodes[targetNodeId]?.name ?? '' }}</h6>
        </div>
        <div class="section border-b">
          <p class="key">Contributions</p>
          <p class="text-sm text-gray-900">
            {{ nodes[targetNodeId]?.numberCommits ?? '' }}
          </p>
        </div>
        <div class="section">
          <p class="key">Topics</p>
          <div class="flex flex-wrap h-24 overflow-scroll">
            <div
              v-for="topic in nodes[targetNodeId]?.topics ??
              []"
              :key="topic"
              class="topic"
            >
              {{ topic }}
            </div>
          </div>
        </div>
        <div
          class="w-full text-center py-1 my-3 bg-gray-100 rounded-lg"
        >
          <a
            :href="nodes[targetNodeId]?.url"
            target="_blank"
          >
            <button class="text-gray-900 text-sm">
              View on GitHub
            </button>
          </a>
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
        <span class="font-medium"> Topics </span>
        <div
          class="text-xs max-h-20 overflow-scroll flex flex-wrap mt-2"
        >
          <div
            v-for="topic in edges[targetEdgeId]?.topics ??
            []"
            :key="topic"
            class="topic"
          >
            {{ topic }}
          </div>
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
const hoveredEdge = ref(null)
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
        color: edgeColor,
        width: edgeSize
      },
      hover: {
        color: edgeColor,
        width: edgeSize
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
        const id = [contributionIds[i], contributionIds[j]]
          .sort()
          .join('-')
        if (contributionIds[i] === contributionIds[j]) {
          break
        }
        if (!edges[id]) {
          edges[id] = {
            source: contributionIds[i].toString(),
            target: contributionIds[j].toString(),
            topics: [topic],
            size: 1
          }
        } else {
          if (edges[id].topics.indexOf(topic) === -1) {
            edges[id].topics.push(topic)
          }
          edges[id].size = Math.min(
            ((3 - 1) / (10 - 1)) *
              (edges[id].topics.length - 1) +
              1,
            3
          )
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

function listsOverlap(list1, list2, percentage) {
  let overlapCount = 0
  let totalCount = 0

  // Use a hash set to store the elements of the first list
  const set = new Set(list1)

  // Iterate through the second list and check if each element is in the hash set
  for (let i = 0; i < list2.length; i++) {
    if (set.has(list2[i])) {
      overlapCount++
    }
    totalCount++
  }

  // Calculate the overlap percentage
  const overlapPercentage = overlapCount / totalCount

  // Compare the overlap percentage to the given threshold
  return overlapPercentage > percentage
}

function edgeColor(edge) {
  if (!hoveredEdge.value) return '#F6B9AB'
  // if the hovered edge and the current edge share any topic
  const sharedTopics = listsOverlap(
    hoveredEdge.value.topics,
    edge.topics,
    0.5
  )
  return sharedTopics ? '#E94F2E' : '#F6B9AB'
}

function edgeSize(edge) {
  if (!hoveredEdge.value) return edge.size
  // if the hovered edge and the current edge share any topic
  const sharedTopics = listsOverlap(
    hoveredEdge.value.topics,
    edge.topics,
    0.5
  )
  return sharedTopics ? edge.size + 0.5 : edge.size
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

    tooltipPos.value = {
      left:
        domPoint.x -
        tooltip.value.offsetWidth / 2 +
        // left +
        'px',
      top: domPoint.y - targetNodeRadius.value - 300 + 'px'
    }
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
    hoveredEdge.value = null
    targetEdgeId.value = ''
    edgeToolTipOpacity.value = 0 // hide
  },
  'node:pointerover': ({ node }) => {
    hoveredNode.value = nodes.value[node].name
  },
  'node:pointerout': () => {
    hoveredNode.value = null
  },
  'edge:click': ({ edge }) => {
    hoveredEdge.value = edges.value[edge]
    targetEdgeId.value = edge ?? ''
    edgeToolTipOpacity.value = 1 // show
  },
  'edge:pointerover': ({ edge }) => {
    hoveredEdge.value = edges.value[edge]
  },
  'edge:pointerout': () => {
    hoveredEdge.value = null
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
  z-index: 100000000;
  @apply bg-white shadow-lg rounded-lg p-4 cursor-auto max-h-88 w-60 overflow-hidden;
}

.edge-tooltip {
  top: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  z-index: 100000000;
  @apply bg-white text-sm shadow-lg rounded-lg p-2  w-60 cursor-auto;
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
  @apply pb-2 border-gray-200;
}

.key {
  @apply text-gray-400 text-xs font-medium py-2;
}

.topic {
  @apply border bg-gray-50 border-gray-200 text-gray-900 rounded-lg px-2 py-1 text-xs mr-2 mb-2;
}
</style>
