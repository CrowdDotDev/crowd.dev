export default {
  guides: (state) => state.guides,
  notcompletedGuides: (state) =>
    state.guides.filter((guide) => !guide.completed)
}
