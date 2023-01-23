<template>
  <div class="panel contributions-panel relative">
    <div ref="mine" class="background-dotted h-full">
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
        <div>
          {{ nodes[targetNodeId]?.name ?? '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { defineConfigs } from 'v-network-graph'
import { ForceLayout } from 'v-network-graph/lib/force-layout'

// ref="graph"
const graph = ref()
// ref="tooltip"
const tooltip = ref()

const mine = ref()

const nodes = computed(() => {
  return {
    node1: { name: 'Node 1', size: 20 },
    node2: { name: 'Node 2', size: 10 },
    node3: { name: 'Node 3', size: 15 },
    node4: { name: 'Node 4', size: 8 },
    node5: { name: 'Node 5', size: 5 }
  }
})

const edges = {
  edge1: { source: 'node1', target: 'node2' },
  edge12: { source: 'node1', target: 'node2' },
  edge2: { source: 'node2', target: 'node3' },
  edge3: { source: 'node3', target: 'node4' }
}

const layouts = ref({})

const configs = defineConfigs({
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
          .force('edge', forceLink.distance(50))
          .force('charge', d3.forceManyBody())
          .force(
            'collide',
            d3.forceCollide(50).strength(0.1)
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
      color: '#E5E7EB',
      strokeWidth: 3,
      strokeColor: '#FFFFFF'
    }
  },
  edge: {
    normal: {
      color: '#111827',
      width: 1
    }
  }
})

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

    // console.log('dompoint', domPoint)
    const top = mine.value.getBoundingClientRect().top
    // console.log('top', top)
    // calculates top-left position of the tooltip.
    console.log('tooltip', tooltip.value.offsetWidth)
    console.log('domPoint', domPoint.y)
    console.log('top', top)
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
  },
  // eslint-disable-next-line no-unused-vars
  'node:pointerout': (_) => {
    tooltipOpacity.value = 0 // hide
  }
}
</script>

<style lang="css" scoped>
.tooltip {
  top: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  width: 80px;
  height: 36px;
  padding: 10px;
  text-align: center;
  box-shadow: 2px 2px 2px #aaa;
  transition: opacity 0.2s linear;
  pointer-events: none;
  z-index: 100000000000;
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
</style>
