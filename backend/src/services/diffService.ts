import * as XLSX from "xlsx";
import { AppDataSource } from "../config/data-source";
import { Upload } from "../entities/Upload";
import { absoluteFilePath } from "./fileService";
import { NotFoundError } from "../utils/errors";
import { diffRows, RowArray, DiffResult } from "./diffRows";

export type { ChangedCell, DiffResult, RowArray } from "./diffRows";

function readRows(absolutePath: string): RowArray[] {
  const workbook = XLSX.readFile(absolutePath);
  const sheetName = workbook.SheetNames.includes("Complete Translations")
    ? "Complete Translations"
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<RowArray>(sheet, { header: 1 });
}

export async function computeDiff(
  oldFileId: string,
  newFileId: string
): Promise<DiffResult> {
  const uploadRepo = AppDataSource.getRepository(Upload);
  const [oldUpload, newUpload] = await Promise.all([
    uploadRepo.findOne({ where: { id: oldFileId } }),
    uploadRepo.findOne({ where: { id: newFileId } }),
  ]);

  if (!oldUpload) throw new NotFoundError(`Upload not found: ${oldFileId}`);
  if (!newUpload) throw new NotFoundError(`Upload not found: ${newFileId}`);

  const oldRows = readRows(absoluteFilePath(oldUpload.filePath));
  const newRows = readRows(absoluteFilePath(newUpload.filePath));

  return diffRows(oldRows, newRows);
}
