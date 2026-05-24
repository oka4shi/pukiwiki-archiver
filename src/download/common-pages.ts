import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";
import { saveContent } from "../lib/save";
import {
  parseArticleHrefs,
  parseAttachmentOpenHrefs,
  parseAttachmentInfoHrefs,
} from "../lib/parse";

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

  // ?cmd=history は壊れており実際のページが存在しないため、ダミーページを保存する
  const historyDummyHtml =
    "<!DOCTYPE html><html><body><p>履歴一覧ページ (?cmd=history) はこのWikiでは利用できません。</p></body></html>";
  await saveContent(OUTPUT_DIR, "history.html", historyDummyHtml);
  console.log("  ✓ history.html (ダミー)");

  const attachlistHtml = await dl.saveHtml(
    "?plugin=attach&pcmd=list",
    "attachlist.html",
  );
  const attachmentOpenHrefs = attachlistHtml
    ? await parseAttachmentOpenHrefs(attachlistHtml)
    : [];
  const attachmentInfoHrefs = attachlistHtml
    ? await parseAttachmentInfoHrefs(attachlistHtml)
    : [];

  console.log(`\n  → 記事: ${String(articleHrefs.length)} 件`);
  console.log(`  → 添付ファイル: ${String(attachmentOpenHrefs.length)} 件`);
  console.log(
    `  → 添付ファイルの詳細ページ: ${String(attachmentInfoHrefs.length)} 件`,
  );

  return { articleHrefs, attachmentOpenHrefs, attachmentInfoHrefs };
}

export async function downloadCommonPages(
  fetcher: Fetcher,
  delayMs: number,
): Promise<void> {
  console.log("\n共通ページをダウンロード中...");
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  const pages = [
    { url: "?cmd=newpage", path: "newpage.html", label: "新規" },
    { url: "?cmd=search", path: "search.html", label: "検索" },
    {
      url: "?RecentChanges",
      path: "RecentChanges/index.html",
      label: "RecentChanges",
    },
    { url: "?cmd=rss", path: "rss.xml", label: "RSS" },
    { url: "?cmd=rss&ver=1.0", path: "rss-1.0.xml", label: "RSS(1.0)" },
  ];

  for (const { url, path, label } of pages) {
    console.log(`\n  [${label}]`);
    await dl.saveHtml(url, path);
  }

  // アセットをダウンロード
  console.log("\n  [アセット]");

  for (const file of SKIN_FILES) {
    await dl.saveFile(`skin/${file}`, `skin/${file}`);
  }

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

  await downloadListPages(fetcher, configs.delayMs);
  await downloadCommonPages(fetcher, configs.delayMs);
  console.log("\n完了しました。");
}
