import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";
import { parseArticleHrefs, parseAttachmentHrefs } from "../lib/parse";

type Fetcher = ReturnType<typeof createFetcher>;

export async function downloadListPages(
  fetcher: Fetcher,
  delayMs: number,
): Promise<{
  articleHrefs: string[];
  attachmentOpenHrefs: string[];
  attachmentInfoHrefs: string[];
}> {
  console.log("\nリストページをダウンロード中...");
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  const listHtml = await dl.saveHtml("?cmd=list", "list.html");
  if (!listHtml) {
    console.error("リストページの取得に失敗したため終了します");
    process.exit(1);
  }
  const articleHrefs = await parseArticleHrefs(listHtml);

  await dl.saveHtml("?cmd=filelist", "filelist.html");

  const attachlistHtml = await dl.saveHtml(
    "?plugin=attach&pcmd=list",
    "attachlist.html",
  );
  const [attachmentOpenHrefs, attachmentInfoHrefs] = attachlistHtml
    ? await parseAttachmentHrefs(attachlistHtml)
    : [[], []];

  await dl.saveHtml("?RecentChanges", "RecentChanges/index.html");

  console.log(`\n  → 記事: ${String(articleHrefs.length)} 件`);
  console.log(`  → 添付ファイル: ${String(attachmentOpenHrefs.length)} 件`);
  console.log(`  → 添付ファイルの詳細ページ: ${String(attachmentInfoHrefs.length)} 件`);

  return { articleHrefs, attachmentOpenHrefs, attachmentInfoHrefs };
}

if (import.meta.main) {
  const { baseUrl } = configs;
  if (!baseUrl) {
    console.error("BASE_URL が設定されていません");
    process.exit(1);
  }
  const fetcher = createFetcher(baseUrl, configs.basicAuth);
  await downloadListPages(fetcher, configs.delayMs);
  console.log("\n完了しました。");
}
