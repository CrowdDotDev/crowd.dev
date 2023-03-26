export class GenericModel {
  static get fields() {
    return [];
  }

  static presenter(row, fieldName) {
    if (!this.fields[fieldName]) {
      throw new Error(`${fieldName} not found`);
    }

    return this.fields[fieldName].forPresenter(
      row[this.fields[fieldName].name],
    );
  }
}
