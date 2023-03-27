export class GenericModel {
  static get fields() {
    return [];
  }

  static presenter(row, fieldName) {
    if (!this.fields[fieldName]) {
      return row[fieldName] || '';
    }
    return this.fields[fieldName].forPresenter(
      row[this.fields[fieldName].name],
    );
  }
}
