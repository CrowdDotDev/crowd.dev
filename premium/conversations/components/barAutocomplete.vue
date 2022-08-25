//
<template>
  //
  <div ref="autocompleteContainer"></div>
  //
</template>

//
<script lang="jsx">
// import { h as createElement, Fragment, render } from "vue";

// import { createWidgetMixin } from "vue-instantsearch/vue3/es";
// import { connectSearchBox } from "instantsearch.js/es/connectors";
// import { autocomplete } from "@algolia/autocomplete-js";
// import { createQuerySuggestionsPlugin } from "@algolia/autocomplete-plugin-query-suggestions";
// import { searchClient } from "./helpers/searchClient";
// import "@algolia/autocomplete-theme-classic";
// import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";

// const INSTANT_SEARCH_INDEX_NAME = "activities";
// const INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE = "hey";
// function debounce(fn, time) {
//   let timerId;

//   return function (...args) {
//     if (timerId) {
//       clearTimeout(timerId);
//     }

//     timerId = setTimeout(() => fn(...args), time);
//   };
// }

// export default {
//   mixins: [createWidgetMixin({ connector: connectSearchBox })],
//   mounted() {
//     const { instantSearchInstance } = this;
//     function getInstantSearchCurrentChannel() {
//       return undefined;
//     }

//     function setInstantSearchUiState({
//       query,
//       channel,
//       resetChannel = false,
//     }) {
//       let hierarchicalMenu;
//       if (resetChannel) {
//         hierarchicalMenu = {
//           hierarchicalMenu: { [INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE]: [] },
//         };
//       } else if (!channel) {
//         hierarchicalMenu = {};
//       } else {
//         hierarchicalMenu = {
//           hierarchicalMenu: {
//             [INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE]: [channel],
//           },
//         };
//       }
//       instantSearchInstance.setUiState((uiState) => ({
//         ...uiState,
//         [INSTANT_SEARCH_INDEX_NAME]: {
//           ...uiState[INSTANT_SEARCH_INDEX_NAME],
//           page: 1,
//           query,
//           ...hierarchicalMenu,
//         },
//       }));
//     }

//     const debouncedSetInstantSearchUiState = debounce(
//       setInstantSearchUiState,
//       500
//     );

//     const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
//       key: "instantsearch",
//       limit: 3,
//       transformSource({ source }) {
//         return {
//           ...source,
//           onSelect({ item }) {
//             setInstantSearchUiState({
//               query: item.label,
//               channel: item.channel,
//             });
//           },
//         };
//       },
//     });

//     const querySuggestionsPlugin = createQuerySuggestionsPlugin({
//       searchClient,
//       indexName: INSTANT_SEARCH_INDEX_NAME,
//       getSearchParams() {
//         const currentChannel = getInstantSearchCurrentChannel();

//         if (!currentChannel) {
//             recentSearchesPlugin.data.getAlgoliaSearchParams({
//               hitsPerPage: 6,
//             })
//           );
//           return recentSearchesPlugin.data.getAlgoliaSearchParams({
//             hitsPerPage: 6,
//           });
//         }

//         return recentSearchesPlugin.data.getAlgoliaSearchParams({
//           hitsPerPage: 3,
//           facetFilters: [
//             `${INSTANT_SEARCH_INDEX_NAME}.facets.exact_matches.categories.value:-${currentChannel}`,
//           ],
//         });
//       },
//       // channelAttribute: [
//       //   "instant_search",
//       //   "facets",
//       //   "exact_matches",
//       //   INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE,
//       // ],
//       transformSource({ source }) {
//         const currentChannel = getInstantSearchCurrentChannel();

//         return {
//           ...source,
//           sourceId: "querySuggestionsPlugin",
//           onSelect({ item }) {
//             setInstantSearchUiState({
//               query: item.query,
//               channel: item.__autocomplete_qsChannel,
//             });
//           },
//           getItems(params) {
//             if (!params.state.query) {
//               return [];
//             }

//             return source.getItems(params);
//           },
//           templates: {
//             ...source.templates,
//             header({ items }) {
//               if (!currentChannel || items.length === 0) {
//                 return null;
//               }

//               return (
//                 <Fragment>
//                   <span className="aa-SourceHeaderTitle">
//                     In other categories
//                   </span>
//                   <span className="aa-SourceHeaderLine" />
//                 </Fragment>
//               );
//             },
//           },
//         };
//       },
//     });

//     const initialState =
//       instantSearchInstance.mainIndex.getHelper()?.state || {};

//     this.autocompleteInstance = autocomplete({
//       container: this.$refs.autocompleteContainer,
//       placeholder: "Search for products",
//       detachedMediaQuery: "none",
//       openOnFocus: true,
//       plugins: [querySuggestionsPlugin],
//       initialState: { query: initialState.query || "" },
//       onSubmit({ state }) {
//         setInstantSearchUiState({ query: state.query });
//       },
//       onReset() {
//         setInstantSearchUiState({ query: "", resetChannel: true });
//       },
//       onStateChange({ prevState, state }) {
//         if (prevState.query !== state.query) {
//           debouncedSetInstantSearchUiState({ query: state.query });
//         }
//       },
//       renderer: {
//         createElement,
//         Fragment,
//         render,
//       },
//     });
//   },
//   beforeUnmount() {},
// };
//
</script>
