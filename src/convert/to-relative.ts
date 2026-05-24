import { convertLinksToRelativePath } from "../lib/linkConverter.ts";
import {
  parseDirectoryArgs,
  validateAndCreateDirectories,
  copyDirectory,
  processHtmlDirectory,
} from "./shared.ts";

async function main() {
  const { inputDir, outputDir } = parseDirectoryArgs();
  const { absoluteInputDir, absoluteOutputDir } = validateAndCreateDirectories(
    inputDir,
    outputDir,
  );

  console.log(`Converting links to relative paths...`);
  console.log(`  Input: ${absoluteInputDir}`);
  console.log(`  Output: ${absoluteOutputDir}`);
  console.log();

  if (inputDir === outputDir) {
    // インプレース変換の場合
    await processHtmlDirectory(
      absoluteInputDir,
      absoluteInputDir,
      convertLinksToRelativePath,
    );
  } else {
    // 別ディレクトリへのコピー + 変換の場合
    copyDirectory(absoluteInputDir, absoluteOutputDir);
    await processHtmlDirectory(
      absoluteOutputDir,
      absoluteOutputDir,
      convertLinksToRelativePath,
    );
  }

  console.log();
  console.log(`✓ Conversion complete!`);
}

if (import.meta.main) {
  await main();
}
