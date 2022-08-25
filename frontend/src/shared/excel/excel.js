import FileSaver from 'file-saver'
import XLSX from 'xlsx'

export const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const EXCEL_TYPE_WITH_CHARSET = `${EXCEL_TYPE};charset=UTF-8`
export const EXCEL_EXTENSION = '.csv'

export class Excel {
  static exportAsExcelFile(json, header, fileName) {
    let worksheet = XLSX.utils.json_to_sheet(json, {
      header,
      skipHeader: false
    })

    let workbook = {
      Sheets: { data: worksheet },
      SheetNames: ['data']
    }

    let excelBuffer = XLSX.write(workbook, {
      bookType: 'csv',
      type: 'array'
    })

    this.saveAsExcelFile(excelBuffer, fileName)
  }

  static saveAsExcelFile(buffer, fileName) {
    const data = new Blob([buffer], {
      type: EXCEL_TYPE_WITH_CHARSET
    })
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION)
  }
}
