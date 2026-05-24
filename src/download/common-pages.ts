import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";

type Fetcher = ReturnType<typeof createFetcher>;

const SKIN_FILES = ["pukiwiki.css", "main.js"];
const IMAGE_FILES = [
  "pukiwiki.png",
  "edit.png",
  "file.png",
  "top.png",
  "freeze.png",
  "diff.png",
  "backup.png",
  "copy.png",
  "rename.png",
  "reload.png",
  "new.png",
  "list.png",
  "search.png",
  "recentchanges.png",
  "help.png",
  "rss.png",
];

export async function downloadCommonPages(
  fetcher: Fetcher,
  delayMs: number,
): Promise<void> {
  console.log("\n共通ページをダウンロード中...");
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  const pages = [
    { url: "?cmd=newpage", path: "newpage.html", label: "新規" },
    { url: "?cmd=search", path: "search.html", label: "検索" },
    { url: "?cmd=rss", path: "rss.xml", label: "RSS" },
    { url: "?cmd=rss&ver=1.0", path: "rss-1.0.xml", label: "RSS(1.0)" },
  ];

  for (const { url, path, label } of pages) {
    console.log(`\n  [${label}]`);
    await dl.saveHtml(url, path);
  }

  // アセットをダウンロード
  console.log("\n  [アセット]");

  // Download skin files
  for (const file of SKIN_FILES) {
    await dl.saveFile(`skin/${file}`, `skin/${file}`);
  }

  // Download image files
  for (const file of IMAGE_FILES) {
    await dl.saveFile(`image/${file}`, `image/${file}`);
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
