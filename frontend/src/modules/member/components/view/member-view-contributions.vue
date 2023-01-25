<template>
  <div class="panel contributions-panel relative h-80">
    <div class="py-4 px-6 flex justify-between">
      <p class="flex align-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
          class="h-5 w-5 mr-2"
        />
        <span class="font-medium text-black">
          OSS contributions
        </span>
      </p>
      <div
        class="text-gray-500 flex align-center italic text-2xs"
      >
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
        <div class="section border-b mx-4">
          <p class="key">Repository</p>
          <p class="break-words font-medium text-black">
            {{ nodes[targetNodeId]?.fullName ?? '' }}
          </p>
        </div>
        <div class="section border-b mx-4">
          <p class="key">Contributions</p>
          <p class="text-sm text-gray-900">
            {{ nodes[targetNodeId]?.numberCommits ?? '' }}
          </p>
        </div>
        <div class="section ml-4">
          <p class="key">Topics</p>
          <div
            class="flex flex-wrap h-24 overflow-y-scroll pr-4"
          >
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
        <div class="pt-4 mx-4">
          <button
            class="text-gray-900 text-sm w-full text-center my-auto bg-gray-100 rounded-lg h-8 py-2 btn"
            @click="openGithubRepo"
          >
            View on GitHub
          </button>
        </div>
      </div>
      <div
        ref="edgeTooltip"
        class="edge-tooltip"
        :class="{
          'pointer-events-none': targetEdgeId === ''
        }"
        :style="{
          ...edgeToolTipPos,
          opacity: edgeToolTipOpacity
        }"
      >
        <span class="font-medium"> Topics </span>
        <div
          class="text-xs h-20 overflow-scroll flex flex-wrap mt-2"
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

// Define the props that will be passed to this component
const props = defineProps({
  contributions: {
    type: Array,
    required: true
  }
})

// These are the min and max size for the nodes in the graph
const maxSize = 40
const minSize = 10
const edgeMarginTop = 20

// This ref is used to change the size of the nodes in the graph,
// it will be used to multiply the size of each node based on the zoom level
const reduceFactor = ref(1)

// These refs are used to store references to the
// graph and tooltip elements in the template
const graph = ref()
const tooltip = ref()
const edgeTooltip = ref()

// These refs are used to store the id of the target node
// and edge when hovering
const targetNodeId = ref('')
const targetEdgeId = ref('')

// These refs are used to store references to the hovered node and edge
const hoveredNode = ref(null)
const hoveredEdge = ref(null)

// This ref is used to store the different layouts for the graph
const layouts = ref({})

// These refs are used to store the opacity and position of the tooltip
const tooltipOpacity = ref(0)
const tooltipPos = ref({ left: '0px', top: '0px' })

// These refs are used to store the opacity and position of the edge tooltip
const edgeToolTipOpacity = ref(0)
const edgeToolTipPos = ref({ left: '0px', top: '0px' })

// This reactive object is used to store the configurations for the graph
const configs = reactive(
  defineConfigs({
    view: {
      layoutHandler: new ForceLayout({
        positionFixedByDrag: false,
        positionFixedByClickWithAltKey: true,
        createSimulation: (d3, nodes, edges) => {
          // This creates the simulation for the graph using D3
          // you can learn more here: https://github.com/d3/d3-force#forces
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
      draggable: () => !isDisabled.value,
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
      selectable: true,
      normal: {
        color: edgeColor,
        width: edgeSize
      },
      hover: {
        color: edgeColor,
        width: edgeSize
      },
      selected: {
        color: edgeColor,
        width: edgeSize
      }
    }
  })
)

// nodes computed property
const nodes = computed(() => {
  // Create an empty object to store the nodes
  const nodes = {}
  // Iterate over the contributions prop
  props.contributions.forEach((contribution) => {
    // Extract the name of the contribution from the URL
    const name = contribution.url.split('/').pop()
    // Check if the node for this contribution already exists

    // Calculate the size of the node based on the number of commits and the reduceFactor ref
    const size =
      Math.max(
        Math.min(contribution.numberCommits, maxSize),
        minSize
      ) * reduceFactor.value

    if (!nodes[name]) {
      // If the node does not exist, create a new node object
      const node = {
        name,
        fullName: contribution.url
          .split('/')
          .slice(-2)
          .join('/'),
        size,
        // Store the topics and number of commits for the node
        topics: contribution.topics,
        numberCommits: contribution.numberCommits,
        // Store the URL for the node
        url: contribution.url
      }
      // Add the new node to the nodes object
      nodes[name] = node
    } else {
      // If the node already exists, update its size, number of commits, and topics
      nodes[name].size = size
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
  // Return the nodes object
  return nodes
})

// edges computed property
const edges = computed(() => {
  // Create an empty object to store the edges
  let edges = {}
  // Create an empty object to store a mapping of topics to contribution IDs
  let topicMap = {}
  // Iterate over the contributions prop
  props.contributions.forEach((contribution) => {
    // Extract the name of the contribution from the URL
    const name = contribution.url.split('/').pop()
    // Iterate over the topics for the contribution
    contribution.topics.forEach((topic) => {
      // Check if the topic is already in the topicMap
      if (!topicMap[topic]) {
        // If the topic is not in the topicMap, create a new entry with the contribution's ID
        topicMap[topic] = [name]
      } else {
        // If the topic is already in the topicMap, add the contribution's ID to the array of IDs for that topic
        topicMap[topic].push(name)
      }
    })
  })

  // Iterate over the topics in the topicMap
  for (let topic in topicMap) {
    // Get the array of contribution IDs for the current topic
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

const isDisabled = computed(() => {
  return (
    targetNodeId.value !== '' || targetEdgeId.value !== ''
  )
})

const targetNodePos = computed(() => {
  const nodePos = layouts.value.nodes[targetNodeId.value]
  return nodePos || { x: 0, y: 0 }
})

const targetNodeRadius = computed(() => {
  const node = nodes.value[targetNodeId.value]
  return node?.size
})

function openGithubRepo() {
  const node = nodes.value[targetNodeId.value]
  window.open(node.url, '_blank')
}

function nodeColor(node) {
  if (!hoveredNode.value) return '#E5E7EB'
  return node.name === hoveredNode.value
    ? '#E5E7EB'
    : '#F3F4F6'
}

function edgeColor(edge) {
  if (hoveredNode.value) return '#FBDCD5'
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
      top: domPoint.y - targetNodeRadius.value - 320 + 'px'
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
      top: domPoint.y - edgeMarginTop - 60 - 10 + 'px'
    }
  },
  { deep: true }
)

function turnOff() {
  targetNodeId.value = ''
  tooltipOpacity.value = 0 // hide
  hoveredNode.value = null
  hoveredEdge.value = null
  targetEdgeId.value = ''
  edgeToolTipOpacity.value = 0 // hide
}

const eventHandlers = {
  'node:click': ({ node }) => {
    if (isDisabled.value) {
      turnOff()
      return
    }
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
    if (isDisabled.value) return
    hoveredNode.value = nodes.value[node].name
  },
  'node:pointerout': () => {
    if (isDisabled.value) return
    hoveredNode.value = null
  },
  'edge:click': ({ edge }) => {
    if (isDisabled.value) {
      turnOff()
      return
    }
    hoveredEdge.value = edges.value[edge]
    targetEdgeId.value = edge ?? ''
    edgeToolTipOpacity.value = 1 // show
  },
  'edge:pointerover': ({ edge }) => {
    if (isDisabled.value) return

    hoveredEdge.value = edges.value[edge]
  },
  'edge:pointerout': () => {
    if (isDisabled.value) return
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
  @apply bg-white shadow-lg rounded-lg py-4 px-0 cursor-auto w-60 overflow-hidden;
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
  @apply border bg-gray-50 border-gray-200 text-gray-900 rounded-lg px-2 py-1 text-xs mr-2 mb-2 h-8;
}
</style>
