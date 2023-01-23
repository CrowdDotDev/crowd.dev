<template>
  <div class="panel contributions-panel relative">
    <div class="background-dotted rounded-lg h-full">
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
              v-for="topic in nodes[targetNodeId]?.topics ??
              []"
              :key="topic"
              class="border border-gray-200 text-gray-900 rounded-lg px-2 py-1 text-xs mr-2 mb-2"
            >
              {{ topic }}
            </div>
          </div>
        </div>
        <div class="w-full text-center pt-3">
          <span> Click to open on GitHub </span>
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
import dagre from 'dagre/dist/dagre.min.js'

const props = defineProps({
  contributions: {
    type: Array,
    required: true
  }
})

// ref="graph"
const graph = ref()
// ref="tooltip"
const tooltip = ref()

const nodes = computed(() => {
  const nodes = {}
  props.contributions.forEach((contribution) => {
    const node = {
      name: contribution.url.split('/').pop(),
      size: Math.max(
        Math.min(contribution.numberCommits, 50),
        10
      ),
      topics: contribution.topics,
      numberCommits: contribution.numberCommits,
      url: contribution.url
    }
    nodes[contribution.id.toString()] = node
  })
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
          edges[
            `${contributionIds[i]}-${contributionIds[j]}`
          ] = {
            source: contributionIds[i].toString(),
            target: contributionIds[j].toString(),
            label: topic
          }
        }
      }
    }
  }
  console.log(edges)
  return edges
})

const hoveredEdge = ref(null)
const hoveredNode = ref(null)

const layouts = ref({})

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
              d3.forceCollide(20).strength(0.1)
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
        width: edgeWidth
      },
      hover: {
        color: edgeColor,
        width: edgeWidth
      }
    }
  })
)

function edgeColor(edge) {
  if (hoveredNode.value) return '#F6B9AB'
  return edge.label === hoveredEdge.value
    ? '#E94F2E'
    : '#F29582'
}

function edgeWidth(edge) {
  return edge.label === hoveredEdge.value ? 2.5 : 2
}

function nodeColor(node) {
  if (!hoveredNode.value) return '#E5E7EB'
  return node.name === hoveredNode.value
    ? '#E5E7EB'
    : '#F3F4F6'
}

function layout(direction: 'TB' | 'LR') {
  if (
    Object.keys(data.nodes).length <= 1 ||
    Object.keys(data.edges).length == 0
  ) {
    return
  }

  // convert graph
  // ref: https://github.com/dagrejs/dagre/wiki
  const g = new dagre.graphlib.Graph()
  // Set an object for the graph label
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSize * 2,
    edgesep: nodeSize,
    ranksep: nodeSize * 2
  })
  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes to the graph. The first argument is the node id. The second is
  // metadata about the node. In this case we're going to add labels to each of
  // our nodes.
  Object.entries(data.nodes).forEach(([nodeId, node]) => {
    g.setNode(nodeId, {
      label: node.name,
      width: nodeSize,
      height: nodeSize
    })
  })

  // Add edges to the graph.
  Object.values(data.edges).forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const box: Record<string, number | undefined> = {}
  g.nodes().forEach((nodeId: string) => {
    // update node position
    const x = g.node(nodeId).x
    const y = g.node(nodeId).y
    data.layouts.nodes[nodeId] = { x, y }

    // calculate bounding box size
    box.top = box.top ? Math.min(box.top, y) : y
    box.bottom = box.bottom ? Math.max(box.bottom, y) : y
    box.left = box.left ? Math.min(box.left, x) : x
    box.right = box.right ? Math.max(box.right, x) : x
  })

  const graphMargin = nodeSize * 2
  const viewBox = {
    top: (box.top ?? 0) - graphMargin,
    bottom: (box.bottom ?? 0) + graphMargin,
    left: (box.left ?? 0) - graphMargin,
    right: (box.right ?? 0) + graphMargin
  }
  graph.value?.setViewBox(viewBox)
}

const targetNodeId = ref('')
const tooltipOpacity = ref(0) // 0 or 1
const tooltipPos = ref({ left: '0px', top: '0px' })

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
      top:
        domPoint.y -
        targetNodeRadius.value -
        tooltip.value.offsetHeight -
        10 +
        'px'
    }

    // console.log(tooltipPos.value)
  },
  { deep: true }
)

const eventHandlers = {
  'node:pointerover': ({ node }) => {
    targetNodeId.value = node
    tooltipOpacity.value = 1 // show
    hoveredNode.value = nodes.value[node].name
  },
  // eslint-disable-next-line no-unused-vars
  'node:pointerout': (_) => {
    tooltipOpacity.value = 0 // hide
    hoveredNode.value = null
  },
  'edge:pointerover': ({ edge }) => {
    console.log('edge', edge)
    hoveredEdge.value = edges.value[edge].label
  },
  'edge:pointerout': () => {
    hoveredEdge.value = null
  },
  'node:click': ({ node }) => {
    // open repo url in new tab
    console.log(node)
    window.open(
      'https://github.com/CrowdDotDev/crowd.dev',
      '_blank'
    )
  }
}
</script>

<style lang="css" scoped>
.tooltip {
  top: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  width: 240px;
  transition: opacity 0.2s linear;
  pointer-events: none;
  z-index: 100000000000;
  @apply bg-white shadow-lg rounded-lg p-4;
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
</style>
