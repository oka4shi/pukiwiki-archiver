import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";
import {
  parseAttachmentOpenHrefs,
  parseAttachmentInfoHrefs,
} from "../lib/parse";
import { attachmentHrefToPath } from "../lib/urlToPath";

type Fetcher = ReturnType<typeof createFetcher>;

export async function downloadAttachments(
  fetcher: Fetcher,
  attachmentOpenHrefs: string[],
  attachmentInfoHrefs: string[],
  delayMs: number,
): Promise<void> {
  console.log(
    `\n添付ファイルをダウンロード中... (${String(attachmentOpenHrefs.length)} 件)`,
  );
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  for (const href of attachmentOpenHrefs) {
    const savePath = attachmentHrefToPath(href);
    if (!savePath) {
      console.warn(`  ? 未対応のURL: ${href}`);
      continue;
    }

    await dl.saveFile(href, savePath);
  }

  console.log(
    `\n添付ファイルの詳細ページをダウンロード中... (${String(attachmentInfoHrefs.length)} 件)`,
  );

  for (const href of attachmentInfoHrefs) {
    const savePath = attachmentHrefToPath(href);
    if (!savePath) {
      console.warn(`  ? 未対応のURL: ${href}`);
      continue;
    }

    await dl.saveHtml(href, savePath);
  }
}

if (import.meta.main) {
  const { baseUrl } = configs;
  if (!baseUrl) {
    console.error("BASE_URL が設定されていません");
    process.exit(1);
  }
  const fetcher = createFetcher(baseUrl, configs.basicAuth);

  console.log("添付ファイル一覧を取得中...");
  const result = await fetcher("?plugin=attach&pcmd=list");
  if (!result.success) {
    console.error(
      "添付ファイル一覧の取得に失敗しました:",
      result.error.message,
    );
    process.exit(1);
  }
  const html = await result.response.text();
  const attachmentOpenHrefs = await parseAttachmentOpenHrefs(html);
  const attachmentInfoHrefs = await parseAttachmentInfoHrefs(html);

  await downloadAttachments(
    fetcher,
    attachmentOpenHrefs,
    attachmentInfoHrefs,
    configs.delayMs,
  );
  console.log("\n完了しました。");
}
