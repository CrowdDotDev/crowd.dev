export default {
  notcompletedGuides: (state) => state.guides.filter((guide) => !guide.completed),
};
