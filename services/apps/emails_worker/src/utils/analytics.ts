export function getChangeAndDirection(thisWeekValue: number, previousWeekValue: number) {
  let changeAndDirection: {
    changeVsLastWeek: number
    changeVsLastWeekPercentage: string
    changeVsLastWeekDerivative: 'increasing' | 'equal' | 'decreasing'
  }

  if (thisWeekValue > previousWeekValue) {
    changeAndDirection = {
      changeVsLastWeek: thisWeekValue - previousWeekValue,
      changeVsLastWeekPercentage: Number(
        ((thisWeekValue - previousWeekValue) / thisWeekValue) * 100,
      ).toFixed(2),
      changeVsLastWeekDerivative: 'increasing',
    }
  } else if (thisWeekValue === previousWeekValue) {
    changeAndDirection = {
      changeVsLastWeek: 0,
      changeVsLastWeekPercentage: '0',
      changeVsLastWeekDerivative: 'equal',
    }
  } else {
    changeAndDirection = {
      changeVsLastWeek: previousWeekValue - thisWeekValue,
      changeVsLastWeekPercentage: Number(
        ((previousWeekValue - thisWeekValue) / previousWeekValue) * 100,
      ).toFixed(2),
      changeVsLastWeekDerivative: 'decreasing',
    }
  }

  return changeAndDirection
}
