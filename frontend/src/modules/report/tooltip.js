export const externalTooltipHandler = (
  context,
  clickFn,
) => {
  // Tooltip Element
  const { tooltip, chart } = context;
  let tooltipEl = document.getElementById('chartjs-tooltip');
  // Create element on first render
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.innerHTML = '<table></table>';
    document.body.appendChild(tooltipEl);
  }

  // Handle mouseenter event on tooltip
  tooltipEl.onmouseenter = () => {
    if (chart.canvas) {
      const meta = chart.getDatasetMeta(0);
      const canvas = chart.canvas.getBoundingClientRect();
      const point = meta.data[
        tooltip.dataPoints[0].dataIndex
      ].getCenterPoint();
      const evt = new MouseEvent('mousemove', {
        clientX: canvas.x + point.x,
        clientY: canvas.y + point.y,
      });
      const canvasNode = chart.canvas;

      // Dispatch mousemove event to canvas
      // This will allow for the tooltip render
      // logic to still be on the library side
      canvasNode?.dispatchEvent(evt);
    }
  };

  // hide the tooltip after a delay
  const hideTooltipWithDelay = () => {
    setTimeout(() => {
      tooltipEl.style.opacity = 0;
      tooltipEl.style.display = 'none';
    }, 100); // Adjust the delay time (in milliseconds) as needed
  };

  // Handle mouseleave event on tooltip
  tooltipEl.onmouseleave = ({ clientX, clientY }) => {
    if (chart.canvas) {
      const evt = new MouseEvent('mouseout', {
        clientX,
        clientY,
      });
      const canvasNode = chart.canvas;

      // Dispatch mouseposition in the mouseout event
      // This will hide tooltip
      canvasNode?.dispatchEvent(evt);
    }

    hideTooltipWithDelay();
  };

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.display = 'none';
    return;
  }

  // Set Text
  if (tooltip.body) {
    const titleLines = tooltip.title || [];

    let innerHtml = '<thead>';

    titleLines.forEach((title) => {
      innerHtml += `<tr><th class="text-gray-500 text-xs font-normal">${title}</th></tr>`;
    });

    innerHtml += '</thead><tbody>';

    tooltip.body.forEach(({ lines, after }) => {
      lines.forEach((line) => {
        innerHtml += `<tr class="text-gray-900 text-xs font-medium"><td class="py-2"><span>${line}</span></td></tr>`;
      });

      // TODO: Move this to component
      after.forEach((a) => {
        if (a) {
          let classes;
          if (a.difference === 0) {
            classes = {
              bgColor: 'bg-blue-100',
              color: 'text-blue-700',
            };
          } else if (a.difference > 0) {
            classes = {
              bgColor: 'bg-green-50',
              color: 'text-green-700',
              arrow: 'ri-arrow-up-line',
            };
          } else {
            classes = {
              bgColor: 'bg-red-50',
              color: 'text-red-700',
              arrow: 'ri-arrow-down-line',
            };
          }
          innerHtml += `
          <tr class="border-b border-gray-100 last:border-none text-gray-900 text-xs font-medium">
            <td class="pb-2">
              <div class="flex items-center flex-wrap gap-2">
                <div class="${classes.bgColor} rounded-md ${
  classes.color
} h-5 px-1 flex items-center">
                  ${
  a.difference === 0
    ? '<span class="px-0.5">=</span>'
    : `<i class="${classes.arrow} mr-1"></i>`
}${
  a.difference === 0
    ? ''
    : `<span>${Math.abs(
      a.growth,
    )}% (${Math.abs(a.difference)})</span>`
}</div><span class="text-2xs text-gray-400">vs. ${
  a.previousDate
}</span></div></td></tr>`;
        }
      });
    });

    innerHtml += '</tbody>';

    let footerBtn = document.getElementById(
      'custom-tooltip-footer-btn',
    );

    if (!footerBtn && tooltip.footer) {
      footerBtn = document.createElement('el-button');
      footerBtn.id = 'custom-tooltip-footer-btn';
      tooltip.footer.forEach((lines) => {
        footerBtn.className = 'btn btn--sm btn--full btn--secondary mt-4';
        footerBtn.innerText = lines;
        tooltipEl.appendChild(footerBtn);
      });
    }

    if (footerBtn && !tooltip.footer?.length) {
      document.getElementById('custom-tooltip-footer-btn')?.remove();
    }

    // Add clickFn to footerBtn
    // This will allow each graph to handle the button click differently
    footerBtn.onclick = clickFn;

    const tableRoot = tooltipEl.querySelector('table');
    tableRoot.innerHTML = innerHtml;
  }

  const position = context.chart.canvas.getBoundingClientRect();

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;
  tooltipEl.style.display = 'block';
  tooltipEl.style.backgroundColor = 'white';
  tooltipEl.style.borderRadius = '8px';
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.boxShadow = '0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)';
  tooltipEl.style.left = `${position.left
    + window.pageXOffset
    + tooltip.caretX
    - tooltipEl.getBoundingClientRect().width / 2
  }px`;
  tooltipEl.style.top = `${position.top
    + window.pageYOffset
    + (tooltip.dataPoints?.[0]?.element?.y
      || tooltip.caretY)
    - tooltipEl.getBoundingClientRect().height
    - 20
  }px`;
  tooltipEl.style.padding = '12px';
  tooltipEl.style.textAlign = 'left';
  tooltipEl.style.zIndex = '20';
  tooltipEl.style.maxWidth = '200px';
};
