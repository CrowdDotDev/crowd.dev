import {
  Scale,
  LinearScale,
} from 'chart.js';

/* eslint-disable no-underscore-dangle */

/**
 * This Scale will be used to replace logarithmic scales
 * This is updating the parse method, to allow for 0 values in the graph
 * At the moment since log(0) is undefined, if a value was 0,
 * the data point wasn't drawn on the graph
 * This file follows the implementation in https://www.chartjs.org/docs/master/samples/advanced/derived-axis-type.html
 */
class CustomLogarithmicScale extends Scale {
  constructor(cfg) {
    super(cfg);
    this._startValue = undefined;
    this._valueRange = 0;
  }

  parse(raw, index) {
    const value = LinearScale.prototype.parse.apply(this, [raw, index]);
    return Number.isFinite(value) ? value : null;
  }

  determineDataLimits() {
    const { min, max } = this.getMinMax(true);

    this.min = Number.isFinite(min) ? Math.max(0, min) : null;
    this.max = Number.isFinite(max) ? Math.max(0, max) : null;
  }

  buildTicks() {
    const ticks = [];

    let power = Math.floor(Math.log2(this.min || 1));
    const maxPower = Math.ceil(Math.log2(this.max || 2));
    while (power <= maxPower) {
      ticks.push({ value: 2 ** power });
      power += 1;
    }

    this.min = ticks[0].value;
    this.max = ticks[ticks.length - 1].value;
    return ticks;
  }

  /**
     * @protected
     */
  configure() {
    const start = this.min;

    super.configure();

    this._startValue = Math.log(start);
    this._valueRange = Math.log2(this.max) - Math.log2(start);
  }

  getPixelForValue(value) {
    let parsedValue = value;

    if (parsedValue === undefined || parsedValue === 0) {
      parsedValue = this.min;
    }

    return this.getPixelForDecimal(parsedValue === this.min ? 0
      : (Math.log2(parsedValue) - this._startValue) / this._valueRange);
  }

  getValueForPixel(pixel) {
    const decimal = this.getDecimalForPixel(pixel);
    return 2 ** (this._startValue + decimal * this._valueRange);
  }
}
CustomLogarithmicScale.id = 'customLogarithmic';
CustomLogarithmicScale.defaults = {};

export {
  CustomLogarithmicScale,
};
