/**
 * Bug from element-plus on select components
 * Issue: When mouse leaves select popper,
 * hover class remains in select options
 * This method should be added to @mouseleave in
 * el-option components
 * @param {*} el DOM element
 */
export const onSelectMouseLeave = (el) => {
  el.target.classList.remove('hover')
}
