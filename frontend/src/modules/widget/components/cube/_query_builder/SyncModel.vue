<script>
export default {
  props: {
    chartType: {
      type: String,
      default: null,
    },
    query: {
      type: Object,
      default: () => {},
    },
    modelChartType: {
      type: String,
      default: null,
    },
    modelQuery: {
      type: Object,
      default: () => {},
    },
  },

  emits: ['update:modelChartType', 'update:modelQuery'],

  data() {
    return {
      localQuery: {},
      localCharType: null,
    };
  },

  watch: {
    chartType: {
      immediate: true,
      deep: true,
      handler(newValue) {
        this.updateChartType(newValue);
      },
    },
    query: {
      immediate: true,
      deep: true,
      handler(newValue) {
        this.updateQueryProp(newValue);
      },
    },
  },

  methods: {
    updateChartType(value) {
      if (value) {
        this.localCharType = value;
        this.$emit(
          'update:modelChartType',
          this.localCharType,
        );
      }
    },
    updateQueryProp(value) {
      if (value) {
        this.localQuery = value;
        this.$emit(
          'update:modelQuery',
          JSON.parse(JSON.stringify(this.localQuery)),
        );
      }
    },
  },
};
</script>
