import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";

type Fetcher = ReturnType<typeof createFetcher>;

export async function downloadCommonPages(
  fetcher: Fetcher,
  delayMs: number,
): Promise<void> {
  console.log("\n共通ページをダウンロード中...");
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  const pages = [
    { url: "?cmd=new", path: "new.html", label: "新規" },
    { url: "?cmd=search", path: "search.html", label: "検索" },
    { url: "?cmd=rss", path: "rss.xml", label: "RSS" },
    { url: "?cmd=rss&ver=1.0", path: "rss-1.0.xml", label: "RSS(1.0)" },
  ];

  for (const { url, path, label } of pages) {
    console.log(`\n  [${label}]`);
    await dl.saveHtml(url, path);
  }
}

if (import.meta.main) {
  const { baseUrl } = configs;
  if (!baseUrl) {
    console.error("BASE_URL が設定されていません");
    process.exit(1);
  }
  const fetcher = createFetcher(baseUrl, configs.basicAuth);

  await downloadCommonPages(fetcher, configs.delayMs);
  console.log("\n完了しました。");
}
