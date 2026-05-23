import { configs, OUTPUT_DIR } from "../config";
import { createFetcher } from "../lib/fetch";
import { createDownloader } from "../lib/downloader";
import { parseAttachmentHrefs } from "../lib/parse";
import { attachmentHrefToPath } from "../lib/urlToPath";

type Fetcher = ReturnType<typeof createFetcher>;

/** ファイル名を URL から抽出する。 */
function getFileNameFromUrl(href: string): string | null {
  const params = new URLSearchParams(
    href.startsWith("./?") ? href.slice(3) : href.slice(1),
  );
  return params.get("file");
}

export async function downloadAttachments(
  fetcher: Fetcher,
  attachmentOpenHrefs: string[],
  attachmentInfoHrefs: string[],
  delayMs: number,
): Promise<void> {
  const allHrefs = [...attachmentOpenHrefs, ...attachmentInfoHrefs];
  console.log(
    `\n添付ファイルをダウンロード中... (${String(allHrefs.length)} 件)`,
  );
  const dl = createDownloader(fetcher, OUTPUT_DIR, delayMs);

  // ファイルごとに href をグループ化
  const hrefsByFile = new Map<string, string[]>();
  for (const href of allHrefs) {
    const fileName = getFileNameFromUrl(href);
    if (!fileName) continue;

    if (!hrefsByFile.has(fileName)) {
      hrefsByFile.set(fileName, []);
    }
    hrefsByFile.get(fileName)!.push(href);
  }

  // ファイルごとに処理
  for (const [fileName, hrefs] of hrefsByFile) {
    console.log(`\n  [${fileName}]`);

    for (const href of hrefs) {
      const savePath = attachmentHrefToPath(href);
      if (!savePath) {
        console.warn(`  ? 未対応のURL: ${href}`);
        continue;
      }

      if (href.includes("pcmd=open")) {
        await dl.saveFile(href, savePath);
      } else if (href.includes("pcmd=info")) {
        await dl.saveHtml(href, savePath);
      }
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
  const [attachmentOpenHrefs, attachmentInfoHrefs] =
    await parseAttachmentHrefs(html);

  await downloadAttachments(
    fetcher,
    attachmentOpenHrefs,
    attachmentInfoHrefs,
    configs.delayMs,
  );
  console.log("\n完了しました。");
}
