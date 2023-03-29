import mapKeys from 'lodash/mapKeys';
import ExporterSchema from '@/shared/exporter/exporter-schema';
import { Excel } from '@/shared/excel/excel';

export default class Exporter {
  constructor(fields, excelFileName) {
    this.schema = new ExporterSchema(fields);
    this.excelFileName = excelFileName;
  }

  transformAndExportAsExcelFile(rows) {
    const exportableData = rows.map((row) => {
      const rowCasted = this.schema.cast(row);
      return this.makeNameHeadersIntoLabels(rowCasted);
    });

    return Excel.exportAsExcelFile(
      exportableData,
      this.schema.labels,
      `${this.excelFileName}_${new Date().getTime()}`,
    );
  }

  makeNameHeadersIntoLabels(row) {
    return mapKeys(row, (value, key) => this.schema.labelOf(key));
  }
}
