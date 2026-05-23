import type { Fetcher } from "./fetch";
import { sleep } from "./delay";
import { saveContent } from "./save";

/**
 * レート制限付きダウンローダーを生成する。
 * 各リクエストの前に `delayMs` ミリ秒スリープする。
 */
export function createDownloader(
  fetcher: Fetcher,
  outputDir: string,
  delayMs: number,
) {
  return {
    /** HTML ページを取得して保存する。保存した HTML 文字列を返す（失敗時は null）。 */
    async saveHtml(url: string, savePath: string): Promise<string | null> {
      await sleep(delayMs);
      const result = await fetcher(url);
      if (!result.success) {
        console.error(`  ✗ ${savePath}: ${result.error.message}`);
        return null;
      }
      const html = await result.response.text();
      await saveContent(outputDir, savePath, html);
      console.log(`  ✓ ${savePath}`);
      return html;
    },

    /** バイナリファイルを取得して保存する。失敗時は null を返す。 */
    async saveFile(url: string, savePath: string): Promise<ArrayBuffer | null> {
      await sleep(delayMs);
      const result = await fetcher(url);
      if (!result.success) {
        console.error(`  ✗ ${savePath}: ${result.error.message}`);
        return null;
      }
      const data = await result.response.arrayBuffer();
      await saveContent(outputDir, savePath, data);
      console.log(`  ✓ ${savePath}`);
      return data;
    },
  };
}
