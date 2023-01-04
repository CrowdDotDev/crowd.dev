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

  function getBody(bodyItem) {
    return bodyItem.lines
  }

  // Set Text
  if (tooltip.body) {
    const titleLines = tooltip.title || []
    const bodyLines = tooltip.body.map(getBody)

    let innerHtml = '<thead>'

    titleLines.forEach(function (title) {
      innerHtml += `<tr><th style="color:#9CA3AF; font-size:13px; font-weight: 500">${moment(
        title
      ).format('MMM DD')}</th></tr>`
    })

    innerHtml += '</thead><tbody>'

    bodyLines.forEach(function (body) {
      innerHtml += `<tr><td><span style="color:#111827; font-size:13px; font-weight: 500">${body}</span></td></tr>`
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
    54 +
    'px'
  tooltipEl.style.padding = '12px'
  tooltipEl.style.textAlign = 'left'
  tooltipEl.style.pointerEvents = 'none'
}
