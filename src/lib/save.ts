/** Bun.write は親ディレクトリを自動生成するため、mkdir は不要 */
export async function saveHtml(
  outputDir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  await Bun.write(`${outputDir}/${relativePath}`, content);
}
