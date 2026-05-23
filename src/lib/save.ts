/** Bun.write は親ディレクトリを自動生成するため、mkdir は不要 */
export async function saveContent(
  outputDir: string,
  relativePath: string,
  content: string | ArrayBuffer,
): Promise<void> {
  await Bun.write(`${outputDir}/${relativePath}`, content);
}
