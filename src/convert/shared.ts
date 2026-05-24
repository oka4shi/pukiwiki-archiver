import * as fs from "fs";
import * as path from "path";

/**
 * コマンドライン引数から input/output ディレクトリを解析する
 */
export function parseDirectoryArgs(): {
  inputDir: string;
  outputDir: string;
} {
  const args = process.argv.slice(2);
  let inputDir = "./dist";
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

  return { inputDir, outputDir };
}

/**
 * ディレクトリの存在確認と出力ディレクトリの作成
 */
export function validateAndCreateDirectories(
  inputDir: string,
  outputDir: string,
): { absoluteInputDir: string; absoluteOutputDir: string } {
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

  return { absoluteInputDir, absoluteOutputDir };
}

/**
 * ディレクトリツリーをコピーする
 */
export function copyDirectory(src: string, dest: string): void {
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

/**
 * ディレクトリ内のすべてのHTMLファイルを再帰的に処理する
 * @param convertFn 各ファイルに適用する変換関数
 */
export async function processHtmlDirectory(
  directoryAbsolutePath: string,
  archiveBaseAbsolutePath: string,
  convertFn: (
    fileAbsolutePath: string,
    archiveBaseAbsolutePath: string,
  ) => Promise<void>,
): Promise<void> {
  const files = fs.readdirSync(directoryAbsolutePath);

  for (const file of files) {
    const fileAbsolutePath = path.join(directoryAbsolutePath, file);
    const stat = fs.statSync(fileAbsolutePath);

    if (stat.isDirectory()) {
      // 再帰的にディレクトリを処理
      await processHtmlDirectory(
        fileAbsolutePath,
        archiveBaseAbsolutePath,
        convertFn,
      );
    } else if (stat.isFile() && file.endsWith(".html")) {
      // HTMLファイルを処理
      console.log(`Processing: ${fileAbsolutePath}`);

      try {
        await convertFn(fileAbsolutePath, archiveBaseAbsolutePath);
        console.log(`  ✓ Converted`);
      } catch (error) {
        console.error(
          `  ✗ Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
