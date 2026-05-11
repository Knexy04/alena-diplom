// Multer (busboy) декодирует имя файла из multipart/form-data как latin-1,
// поэтому кириллица превращается в мохибаку вида "Ð¡Ð½Ð¸Ð¼Ð¾Ðº".
// Правильное имя восстанавливается обратной перекодировкой latin-1 → utf-8.
export function decodeMultipartFilename(originalName: string): string {
  if (!originalName) return originalName;
  return Buffer.from(originalName, 'latin1').toString('utf8');
}
