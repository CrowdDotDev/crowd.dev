import config from '@/config'

export default () => {
  return {
    records: {},
    list: {
      ids: [],
      loading: false
    },
    saveLoading: false,
    count: 0,
    pagination: {
      currentPage: 1,
      pageSize: 20
    },
    sorter: {
      prop: 'createdAt',
      order: 'descending'
    },
    featureFlag: {
      isReady: false,
      hasError: false
    },
    hidePmfBanner: localStorage.getItem(
      `hidePmfBanner-${config.formbricks.pmfFormId}`
    )
  }
}
