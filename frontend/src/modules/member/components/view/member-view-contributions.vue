<template>
  <div v-click-away="turnOff" class="panel contributions-panel relative h-80">
    <div class="pt-4 px-6 flex justify-between text-center">
      <div class="flex align-center">
        <img
          alt="Github"
          src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
          class="h-5 w-5 mr-2"
        />
        <span class="font-medium text-black mr-2"> Open source contributions </span>

        <el-tooltip placement="top">
          <template #content>
            This refers to the total # of open source contributions a contributor did on GitHub.<br />
            To receive this attribute you have to enrich your contributors.
          </template>
          <span class="ri-question-line text-base text-gray-400" />
        </el-tooltip>
      </div>

      <div class="text-gray-500 flex align-center italic text-2xs h-5">
        <el-tooltip
          placement="top"
          content="The size of a repository represents the number of contributions made."
        >
          <p>
            <i
              class="ri-checkbox-blank-circle-fill text-gray-200 pr-2 my-auto cursor-default"
            />
            <span class="pr-4 my-auto cursor-default"> Repository </span>
          </p>
        </el-tooltip>
        <el-tooltip
          placement="top"
          content="The thickness of the line represents how many topics are shared between the two repositories."
        >
          <p>
            <span
              class="font-medium text-brand-200 pr-2 my-auto cursor-default"
            >
              —
            </span>
            <span class="my-auto cursor-default"> Topics </span>
          </p>
        </el-tooltip>
      </div>
    </div>
    <div class="pb-4 pl-13 flex justify-between text-center">
      <p class="mt-1 text-gray-900 text-xs">
        Total: {{ contributions.length }} contributions
      </p>
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
          'pointer-events-none': targetNodeId === '',
        }"
        :style="{ ...tooltipPos, opacity: tooltipOpacity }"
      >
        <div class="section border-b mx-4">
          <p class="key">
            Repository
          </p>
          <p class="break-words font-medium text-black">
            {{ nodes[targetNodeId]?.fullName ?? '' }}
          </p>
        </div>
        <div class="section border-b mx-4">
          <p class="key">
            Contributions
          </p>
          <p class="text-sm text-gray-900">
            {{ nodes[targetNodeId]?.numberCommits ?? '' }}
          </p>
        </div>
        <div class="section ml-4">
          <p class="key">
            Topics
          </p>
          <div class="flex flex-wrap h-24 overflow-y-scroll pr-4">
            <div
              v-for="topic in nodes[targetNodeId]?.topics ?? []"
              :key="topic"
              class="topic"
            >
              {{ topic }}
            </div>
          </div>
        </div>
        <div class="pt-4 mx-4">
          <button
            type="button"
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
          'pointer-events-none': targetEdgeId === '',
        }"
        :style="{
          ...edgeToolTipPos,
          opacity: edgeToolTipOpacity,
        }"
      >
        <span class="font-medium"> Topics </span>
        <div class="text-xs h-20 overflow-scroll flex flex-wrap mt-2">
          <div
            v-for="topic in edges[targetEdgeId]?.topics ?? []"
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
  computed, defineProps, reactive, ref, watch,
} from 'vue';
import { defineConfigs } from 'v-network-graph';
import { ForceLayout } from 'v-network-graph/lib/force-layout';

// Define the props that will be passed to this component
const props = defineProps({
  contributions: {
    type: Array,
    required: true,
  },
});

// These are the min and max size for the nodes in the graph
const maxSize = 40;
const minSize = 10;
const edgeMarginTop = 20;

// This ref is used to change the size of the nodes in the graph,
// it will be used to multiply the size of each node based on the zoom level
const reduceFactor = ref(1);

// These refs are used to store references to the
// graph and tooltip elements in the template
const graph = ref();
const tooltip = ref();
const edgeTooltip = ref();

// These refs are used to store the id of the target node
// and edge when hovering
const targetNodeId = ref('');
const targetEdgeId = ref('');

// These refs are used to store references to the hovered node and edge
const hoveredNode = ref(null);
const hoveredEdge = ref(null);

// This ref is used to store the different layouts for the graph
const layouts = ref({});

// These refs are used to store the opacity and position of the tooltip
const tooltipOpacity = ref(0);
const tooltipPos = ref({ left: '0px', top: '0px' });

// These refs are used to store the opacity and position of the edge tooltip
const edgeToolTipOpacity = ref(0);
const edgeToolTipPos = ref({ left: '0px', top: '0px' });

function listsOverlap(list1, list2, percentage) {
  let overlapCount = 0;
  let totalCount = 0;

  // This function takes in two lists and a percentage threshold as inputs
  // It then uses a hash set to store the elements of the first list
  const set = new Set(list1);

  // Next, it iterates through the second list and checks if each element is in the hash set
  for (let i = 0; i < list2.length; i += 1) {
    if (set.has(list2[i])) {
      overlapCount += 1;
    }
    // The totalCount is incremented for every element in the second list
    totalCount += 1;
  }

  // After iterating through the second list, the overlap percentage is calculated by dividing the overlapCount by the totalCount
  const overlapPercentage = overlapCount / totalCount;

  // Finally, the function compares the calculated overlap percentage to the given threshold percentage
  // If the overlap percentage is greater than the threshold, the function returns true, otherwise it returns false.
  return overlapPercentage > percentage;
}

// The nodeColor computed property is used to calculate the color of a node
function nodeColor(node) {
  if (!hoveredNode.value) return '#E5E7EB';
  return node.name === hoveredNode.value ? '#E5E7EB' : '#F3F4F6';
}

// The edgeColor computed property is used to calculate the color of an edge
function edgeColor(edge) {
  if (hoveredNode.value) return '#FBDCD5';
  if (!hoveredEdge.value) return '#F6B9AB';
  // if the hovered edge and the current edge share any topic
  const sharedTopics = listsOverlap(hoveredEdge.value.topics, edge.topics, 0.5);
  return sharedTopics ? '#E94F2E' : '#F6B9AB';
}

// The edgeSize computed property is used to calculate the size of an edge
function edgeSize(edge) {
  if (!hoveredEdge.value) return edge.size;
  // if the hovered edge and the current edge share any topic
  const sharedTopics = listsOverlap(hoveredEdge.value.topics, edge.topics, 0.5);
  return sharedTopics ? edge.size + 0.5 : edge.size;
}

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
          const forceLink = d3.forceLink(edges).id((d) => d.id);
          return d3
            .forceSimulation(nodes)
            .force('edge', forceLink.distance(140))
            .force('charge', d3.forceManyBody().strength(20))
            .force('collide', d3.forceCollide(40).strength(0.1))
            .force('center', d3.forceCenter().strength(0.1))
            .alphaMin(0.001);
        },
      }),
    },
    node: {
      label: {
        visible: true,
      },
      normal: {
        radius: (node) => node.size,
        color: nodeColor,
        strokeWidth: 3,
        strokeColor: '#FFFFFF',
      },
      hover: {
        radius: (node) => node.size,
        color: nodeColor,
        strokeWidth: 3,
        strokeColor: '#FFFFFF',
      },
    },
    edge: {
      selectable: true,
      normal: {
        color: edgeColor,
        width: edgeSize,
        dasharray: 0,
      },
      hover: {
        color: edgeColor,
        width: edgeSize,
        dasharray: 0,
      },
      selected: {
        color: edgeColor,
        width: edgeSize,
        dasharray: 0,
      },
    },
  }),
);

// nodes computed property
const nodes = computed(() => {
  // Create an empty object to store the nodes
  const nodeList = {};
  // Iterate over the contributions prop
  props.contributions.forEach((contribution) => {
    // Extract the name of the contribution from the URL
    const name = contribution.url.split('/').pop();
    // Check if the node for this contribution already exists

    // Calculate the size of the node based on the number of commits and the reduceFactor ref
    const size = Math.max(Math.min(contribution.numberCommits, maxSize), minSize)
      * reduceFactor.value;

    if (!nodeList[name]) {
      // If the node does not exist, create a new node object
      // Add the new node to the nodes object
      nodeList[name] = {
        name,
        fullName: contribution.url.split('/').slice(-2).join('/'),
        size,
        topics: contribution.topics,
        numberCommits: contribution.numberCommits,
        url: contribution.url,
      };
    } else {
      // If the node already exists, update its size, number of commits, and topics
      nodeList[name].size = size;
      nodeList[name].numberCommits += contribution.numberCommits;
      nodeList[name].topics = [
        ...new Set([...nodeList[name].topics, ...contribution.topics]),
      ];
    }
  });
  // Return the nodes object
  return nodeList;
});

// The edges computed property is used to create a mapping of
// edges between contributions based on their shared topics.
const edges = computed(() => {
  // The edges object will store information about the source and
  // target contributions, the topics they share, and the size of the edge.
  const edgeObject = {};
  // The topicMap object is updated to store a mapping of topics
  // to the IDs of contributions that are associated with that topic.
  const topicMap = {};
  props.contributions.forEach((contribution) => {
    // Extract the name of the contribution from the URL
    const name = contribution.url.split('/').pop();
    contribution.topics.forEach((topic) => {
      if (!topicMap[topic]) {
        topicMap[topic] = [name];
      } else {
        topicMap[topic].push(name);
      }
    });
  });

  // Next, the topics in the topicMap are iterated over and for each topic,
  // the corresponding contribution IDs are used to create edges
  // between the contributions.
  Object.keys(topicMap).forEach((topic) => {
    const contributionIds = topicMap[topic];

    for (let i = 0; i < contributionIds.length; i += 1) {
      for (let j = i + 1; j < contributionIds.length; j += 1) {
        const id = [contributionIds[i], contributionIds[j]]
          .sort() // Sort the IDs so that the edge ID is consistent
          .join('-');
        if (contributionIds[i] === contributionIds[j]) {
          break;
        }
        if (!edgeObject[id]) {
          edgeObject[id] = {
            source: contributionIds[i].toString(),
            target: contributionIds[j].toString(),
            topics: [topic],
            size: 1,
          };
        } else {
          if (edgeObject[id].topics.indexOf(topic) === -1) {
            edgeObject[id].topics.push(topic);
          }
          edgeObject[id].size = Math.min(
            ((3 - 1) / (10 - 1)) * (edgeObject[id].topics.length - 1) + 1,
            3,
          );
        }
      }
    }
  });
  return edgeObject;
});

// This code uses computed properties to calculate the center position
// of a specific edge on a graph
const edgeCenterPos = computed(() => {
  // It first checks if the edge exists by checking if
  // the value of the targetEdgeId variable is present in the edges array
  // If it does not exist, it returns an object with x and y values of 0.
  const edge = edges.value[targetEdgeId.value];
  if (!edge) return { x: 0, y: 0 };

  // If it does exist, it assigns the source and target nodes of the edge to variables.
  const sourceNode = edges.value[targetEdgeId.value].source;
  const targetNode = edges.value[targetEdgeId.value].target;

  // Then, it calculates the x and y values of the center position
  // by taking the average of the x and y values of the source and target nodes.
  return {
    x:
      (layouts.value.nodes[sourceNode].x + layouts.value.nodes[targetNode].x)
      / 2,
    y:
      (layouts.value.nodes[sourceNode].y + layouts.value.nodes[targetNode].y)
      / 2,
  };
});

// If either we are on a node or an edge, the graph is disabled
const isDisabled = computed(
  () => targetNodeId.value !== '' || targetEdgeId.value !== '',
);

// The targetNodePos computed property is used to calculate the position
// of the target node on the graph.
const targetNodePos = computed(() => {
  if (!targetNodeId.value) {
    return { x: 0, y: 0 };
  }

  const nodePos = layouts.value.nodes[targetNodeId.value];

  return nodePos || { x: 0, y: 0 };
});

// The targetNodeRadius computed property is used to calculate the radius
// of the target node on the graph.
const targetNodeRadius = computed(() => {
  const node = nodes.value[targetNodeId.value];
  return node?.size;
});

function openGithubRepo() {
  const node = nodes.value[targetNodeId.value];
  window.open(node.url, '_blank');
}

// Update `tooltipPos`
watch(
  () => [targetNodePos.value, tooltipOpacity.value],
  () => {
    if (!graph.value || !tooltip.value) return;

    // translate coordinates: SVG -> DOM
    const domPoint = graph.value.translateFromSvgToDomCoordinates(
      targetNodePos.value,
    );

    tooltipPos.value = {
      left: `${
        domPoint.x - tooltip.value.offsetWidth / 2
        // left +
      }px`,
      top: `${domPoint.y - targetNodeRadius.value - 320}px`,
    };
  },
  { deep: true },
);

watch(
  () => [edgeCenterPos.value, edgeToolTipOpacity.value],
  () => {
    if (!graph.value || !edgeTooltip.value) return { x: 0, y: 0 };
    if (!targetEdgeId.value) return { x: 0, y: 0 };

    // translate coordinates: SVG -> DOM
    const domPoint = graph.value.translateFromSvgToDomCoordinates(
      edgeCenterPos.value,
    );
    // calculates top-left position of the tooltip.
    edgeToolTipPos.value = {
      left: `${domPoint.x - edgeTooltip.value.offsetWidth / 2}px`,
      top: `${domPoint.y - edgeMarginTop - 60 - 10}px`,
    };
    return null;
  },
  { deep: true },
);

// Remove all popups or hovers
function turnOff() {
  targetNodeId.value = '';
  tooltipOpacity.value = 0; // hide
  hoveredNode.value = null;
  hoveredEdge.value = null;
  targetEdgeId.value = '';
  edgeToolTipOpacity.value = 0; // hide
}

const eventHandlers = {
  'node:click': ({ node }) => {
    if (isDisabled.value) {
      targetEdgeId.value = '';
      edgeToolTipOpacity.value = 0; // hide
      hoveredEdge.value = null;
    }
    targetNodeId.value = node;
    tooltipOpacity.value = 1; // show
    hoveredNode.value = nodes.value[node].name;
  },
  'view:click': () => {
    targetNodeId.value = '';
    tooltipOpacity.value = 0; // hide
    hoveredNode.value = null;
    hoveredEdge.value = null;
    targetEdgeId.value = '';
    edgeToolTipOpacity.value = 0; // hide
  },
  'node:pointerover': ({ node }) => {
    hoveredNode.value = nodes.value[node].name;
  },
  'node:pointerout': () => {
    hoveredNode.value = null;
  },
  'edge:click': ({ edge }) => {
    if (isDisabled.value) {
      targetNodeId.value = '';
      tooltipOpacity.value = 0; // hide
      hoveredNode.value = null;
    }
    hoveredEdge.value = edges.value[edge];
    targetEdgeId.value = edge ?? '';
    edgeToolTipOpacity.value = 1; // show
  },
  'edge:pointerover': ({ edge }) => {
    hoveredEdge.value = edges.value[edge];
  },
  'edge:pointerout': () => {
    hoveredEdge.value = null;
  },
  'view:zoom': (zoom) => {
    configs.node.label.visible = zoom >= 0.7;
    if (zoom < 1) {
      reduceFactor.value = zoom;
    }
  },
};
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
  background-image: radial-gradient(#d4d4d4 1px, transparent 0);
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
