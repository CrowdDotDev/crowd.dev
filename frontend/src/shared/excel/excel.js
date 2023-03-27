import FileSaver from 'file-saver';
import Papa from 'papaparse';

export const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const EXCEL_TYPE_WITH_CHARSET = `${EXCEL_TYPE};charset=UTF-8`;
export const EXCEL_EXTENSION = '.csv';

export class Excel {
  static exportAsExcelFile(json, header, fileName) {
    const csv = Papa.unparse({
      data: json,
      fields: header,
    });

    this.saveAsExcelFile(csv, fileName);
  }

  static saveAsExcelFile(buffer, fileName) {
    const data = new Blob([buffer], {
      type: EXCEL_TYPE_WITH_CHARSET,
    });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }
}
