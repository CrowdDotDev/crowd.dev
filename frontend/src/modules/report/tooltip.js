import moment from 'moment'

export const externalTooltipHandler = (context) => {
  // Tooltip Element
  const { tooltip } = context
  let tooltipEl = document.getElementById('chartjs-tooltip')
  // Create element on first render
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.id = 'chartjs-tooltip'
    tooltipEl.innerHTML = '<table></table>'
    document.body.appendChild(tooltipEl)
  }

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0
    return
  }

  // Set Text
  if (tooltip.body) {
    const titleLines = tooltip.title || []

    let innerHtml = '<thead>'

    titleLines.forEach(function (title) {
      innerHtml += `<tr><th class="text-gray-500 text-xs font-normal">${moment(
        title
      ).format('MMM DD')}</th></tr>`
    })

    innerHtml += '</thead><tbody>'

    tooltip.body.forEach(function ({ lines, after }) {
      lines.forEach(function (line) {
        innerHtml += `<tr class="text-gray-900 text-xs font-medium"><td class="py-2"><span>${line}</span></td></tr>`
      })

      // TODO: Move this to component
      after.forEach(function (after) {
        if (after) {
          innerHtml += `
          <tr class="border-b border-gray-100 last:border-none text-gray-900 text-xs font-medium">
            <td class="pb-2">
              <div class="flex items-center gap-2">
                <div class="${
                  after.difference > 0
                    ? 'bg-green-50'
                    : 'bg-red-50'
                } rounded-md ${
            after.difference > 0
              ? 'text-green-700'
              : 'text-red-700'
          } h-5 px-1 flex items-center">
                  <i class="ri-arrow-${
                    after.difference > 0 ? 'up' : 'down'
                  }-line mr-1"></i><span>${
            after.growth
          }% (${
            after.difference
          })</span></div><span class="text-2xs text-gray-400">vs. ${
            after.previousDate
          }</span></div></td></tr>`
        }
      })
    })

    innerHtml += '</tbody>'

    let tableRoot = tooltipEl.querySelector('table')
    tableRoot.innerHTML = innerHtml
  }

  const position =
    context.chart.canvas.getBoundingClientRect()

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1
  tooltipEl.style.backgroundColor = 'white'
  tooltipEl.style.borderRadius = '8px'
  tooltipEl.style.position = 'absolute'
  tooltipEl.style.boxShadow =
    '0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)'
  tooltipEl.style.left =
    position.left +
    window.pageXOffset +
    tooltip.caretX -
    tooltipEl.getBoundingClientRect().width / 2 +
    'px'
  tooltipEl.style.top =
    position.top +
    window.pageYOffset +
    tooltip.caretY -
    tooltipEl.getBoundingClientRect().height -
    40 +
    'px'
  tooltipEl.style.padding = '12px'
  tooltipEl.style.textAlign = 'left'
  tooltipEl.style.pointerEvents = 'none'
}
