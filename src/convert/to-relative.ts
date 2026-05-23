import * as fs from "fs";
import * as path from "path";
import { convertLinksToRelativePath } from "../lib/linkConverter.ts";

/**
 * ディレクトリ内のすべてのHTMLファイルを再帰的に処理する
 */
async function processDirectory(
  directoryAbsolutePath: string,
  archiveBaseAbsolutePath: string,
): Promise<void> {
  const files = fs.readdirSync(directoryAbsolutePath);

  for (const file of files) {
    const fileAbsolutePath = path.join(directoryAbsolutePath, file);
    const stat = fs.statSync(fileAbsolutePath);

    if (stat.isDirectory()) {
      // 再帰的にディレクトリを処理
      await processDirectory(fileAbsolutePath, archiveBaseAbsolutePath);
    } else if (stat.isFile() && file.endsWith(".html")) {
      // HTMLファイルを処理
      console.log(`Processing: ${fileAbsolutePath}`);

      try {
        await convertLinksToRelativePath(
          fileAbsolutePath,
          archiveBaseAbsolutePath,
        );
        console.log(`  ✓ Converted to relative paths`);
      } catch (error) {
        console.error(
          `  ✗ Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

async function main() {
  // コマンドライン引数を処理
  const args = process.argv.slice(2);

  let inputDir = "./archive";
  let outputDir = "./archive";

  // --input と --output フラグをサポート
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      const nextArg = args[++i];
      if (nextArg) inputDir = nextArg;
    } else if (args[i] === "--output" && args[i + 1]) {
      const nextArg = args[++i];
      if (nextArg) outputDir = nextArg;
    }
  }

  // 絶対パスに変換
  const absoluteInputDir = path.resolve(inputDir);
  const absoluteOutputDir = path.resolve(outputDir);

  // ディレクトリの存在確認
  if (!fs.existsSync(absoluteInputDir)) {
    console.error(`Input directory not found: ${absoluteInputDir}`);
    process.exit(1);
  }

  // 出力ディレクトリを作成（必要に応じて）
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }

  console.log(`Converting links to relative paths...`);
  console.log(`  Input: ${absoluteInputDir}`);
  console.log(`  Output: ${absoluteOutputDir}`);
  console.log();

  if (inputDir === outputDir) {
    // インプレース変換の場合
    await processDirectory(absoluteInputDir, absoluteInputDir);
  } else {
    // 別ディレクトリへのコピー + 変換の場合
    // まずファイルツリーをコピー
    copyDirectory(absoluteInputDir, absoluteOutputDir);
    // 次に変換
    await processDirectory(absoluteOutputDir, absoluteOutputDir);
  }

  console.log();
  console.log(`✓ Conversion complete!`);
}

/**
 * ディレクトリツリーをコピーする
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (import.meta.main) {
  await main();
}
