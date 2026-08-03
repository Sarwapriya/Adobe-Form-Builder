export class UnsupportedFileTypeError extends Error {
  constructor(message = "Only .xlsx/.xls files are accepted") {
    super(message);
    this.name = "UnsupportedFileTypeError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
