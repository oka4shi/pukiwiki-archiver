/** `?cmd=list` のHTMLから記事 href 一覧を取得する。 */
export async function parseArticleHrefs(html: string): Promise<string[]> {
  const hrefs: string[] = [];
  const rewriter = new HTMLRewriter().on("div#body ul > li > ul > li > a", {
    element(el) {
      const href = el.getAttribute("href");
      if (href) hrefs.push(href);
    },
  });
  await rewriter.transform(new Response(html)).arrayBuffer();
  return hrefs;
}

/** `?plugin=attach&pcmd=list` のHTMLから添付ファイルダウンロードリンク一覧を取得する。 */
export async function parseAttachmentOpenHrefs(
  html: string,
): Promise<string[]> {
  const hrefs: string[] = [];
  const rewriter = new HTMLRewriter().on(
    "div#contents > div#body > ul > li > ul li > a",
    {
      element(el) {
        const href = el.getAttribute("href");
        if (href) {
          hrefs.push(href);
        }
      },
    },
  );
  await rewriter.transform(new Response(html)).arrayBuffer();
  return hrefs;
}

/** `?plugin=attach&pcmd=list` のHTMLから添付ファイル詳細ページリンク一覧を取得する。 */
export async function parseAttachmentInfoHrefs(
  html: string,
): Promise<string[]> {
  const hrefs: string[] = [];
  const rewriter = new HTMLRewriter().on(
    "div#contents > div#body > ul > li > ul li > span.small > a",
    {
      element(el) {
        const href = el.getAttribute("href");
        if (href) {
          hrefs.push(href);
        }
      },
    },
  );
  await rewriter.transform(new Response(html)).arrayBuffer();
  return hrefs;
}
