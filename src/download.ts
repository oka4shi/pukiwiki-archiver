import { configs } from "./config";
import { createFetcher } from "./lib/fetch";
import { saveHtml } from "./lib/save";
import { articleHrefToPageName, pageNameToOperations } from "./lib/urlToPath";

const OUTPUT_DIR = "dist";

type Fetcher = ReturnType<typeof createFetcher>;

async function fetchAndSave(
  fetcher: Fetcher,
  url: string,
  savePath: string,
): Promise<void> {
  const result = await fetcher(url);
  if (!result.success) {
    console.error(`  ✗ ${url}: ${result.error.message}`);
    return;
  }
  const html = await result.response.text();
  await saveHtml(OUTPUT_DIR, savePath, html);
  console.log(`  ✓ ${savePath}`);
}

async function parseArticleHrefs(html: string): Promise<string[]> {
  const hrefs: string[] = [];
  const rewriter = new HTMLRewriter().on("div#body > ul > li > ul > li > a", {
    element(el) {
      const href = el.getAttribute("href");
      if (href) hrefs.push(href);
    },
  });
  await rewriter.transform(new Response(html)).arrayBuffer();
  return hrefs;
}

async function downloadListPages(fetcher: Fetcher): Promise<string[]> {
  console.log("\nリストページをダウンロード中...");

  // ページの一覧は記事URL抽出のためにHTMLを保持する
  const listResult = await fetcher("?cmd=list");
  let articleHrefs: string[] = [];
  if (listResult.success) {
    const html = await listResult.response.text();
    await saveHtml(OUTPUT_DIR, "list.html", html);
    console.log("  ✓ list.html");
    articleHrefs = await parseArticleHrefs(html);
  } else {
    console.error(`  ✗ ?cmd=list: ${listResult.error.message}`);
  }

  await fetchAndSave(fetcher, "?cmd=filelist", "filelist.html");
  await fetchAndSave(fetcher, "?plugin=attach&pcmd=list", "attachlist.html");
  await fetchAndSave(fetcher, "?RecentChanges", "RecentChanges/index.html");

  return articleHrefs;
}

async function downloadArticle(fetcher: Fetcher, href: string): Promise<void> {
  const pageName = articleHrefToPageName(href);
  if (!pageName) return;

  const rawPageName = href.slice(1); // URL エンコード済みページ名

  // 記事本文
  await fetchAndSave(fetcher, href, `${pageName}/index.html`);

  // 各操作ページ・Backlinks
  for (const { url, path } of pageNameToOperations(pageName, rawPageName)) {
    await fetchAndSave(fetcher, url, path);
  }
}

async function main() {
  const { baseUrl } = configs;
  if (!baseUrl) {
    console.error("BASE_URL が設定されていません");
    process.exit(1);
  }

  const fetcher = createFetcher(baseUrl, configs.basicAuth);

  const articleHrefs = await downloadListPages(fetcher);
  console.log(
    `\n記事ページをダウンロード中... (${String(articleHrefs.length)} 件)`,
  );

  for (const href of articleHrefs) {
    const pageName = articleHrefToPageName(href);
    if (!pageName) continue;
    console.log(`\n  [${pageName}]`);
    await downloadArticle(fetcher, href);
  }

  console.log("\n完了しました。");
}

await main();
