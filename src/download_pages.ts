import { configs } from "./config";
import { createFetcher } from "./lib/fetch";

export const listPages = async ({ baseUrl }: typeof configs) => {
  if (!baseUrl) {
    console.error("BASE_URL が設定されていません");
    return;
  }
  const fetchWiki = createFetcher(baseUrl, configs.basicAuth);
  const listPage = await fetchWiki("/?cmd=list");
  if (!listPage.success) {
    console.error("リストページの取得に失敗しました:", listPage.error);
    return;
  }

  const pageUrls: string[] = [];
  const rewriter = new HTMLRewriter().on("div#body > ul > li > ul > li > a", {
    element(el) {
      const href = el.getAttribute("href");
      if (href) {
        pageUrls.push(href);
      }
    },
  });

  await rewriter.transform(listPage.response).arrayBuffer();
  return pageUrls;
};

if (import.meta.main) {
  await listPages(configs);
}
