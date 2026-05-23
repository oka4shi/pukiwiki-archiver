import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";
import { parseArticleHrefs } from "../lib/parse";
import { articleHrefToPageName, pageNameToOperations } from "../lib/urlToPath";

type Fetcher = ReturnType<typeof createFetcher>;

export async function downloadArticles(
  fetcher: Fetcher,
  articleHrefs: string[],
  delayMs: number,
): Promise<void> {
  console.log(
    `\n記事ページをダウンロード中... (${String(articleHrefs.length)} 件)`,
  );
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  for (const href of articleHrefs) {
    const pageName = articleHrefToPageName(href);
    if (!pageName) continue;

    console.log(`\n  [${pageName}]`);
    const rawPageName = href.slice(1);

    await dl.saveHtml(href, `${pageName}/index.html`);
    for (const { url, path } of pageNameToOperations(pageName, rawPageName)) {
      await dl.saveHtml(url, path);
    }
  }
}

if (import.meta.main) {
  const { baseUrl } = configs;
  if (!baseUrl) {
    console.error("BASE_URL が設定されていません");
    process.exit(1);
  }
  const fetcher = createFetcher(baseUrl, configs.basicAuth);

  console.log("記事一覧を取得中...");
  const result = await fetcher("?cmd=list");
  if (!result.success) {
    console.error("リストページの取得に失敗しました:", result.error.message);
    process.exit(1);
  }
  const listHtml = await result.response.text();
  const articleHrefs = await parseArticleHrefs(listHtml);

  await downloadArticles(fetcher, articleHrefs, configs.delayMs);
  console.log("\n完了しました。");
}
