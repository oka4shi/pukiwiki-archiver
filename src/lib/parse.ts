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

/** `?plugin=attach&pcmd=list` のHTMLから添付ファイル href 一覧を取得する。 */
export async function parseAttachmentHrefs(
  html: string,
): Promise<[string[], string[]]> {
  const openHrefs: string[] = [];
  const infoHrefs: string[] = [];

  const rewriter = new HTMLRewriter().on(
    "div#contents > div#body > ul > li > ul li > a",
    {
      element(el) {
        const href = el.getAttribute("href");
        if (!href) return;

        if (href.includes("pcmd=open")) {
          openHrefs.push(href);
        } else if (href.includes("pcmd=info")) {
          infoHrefs.push(href);
        }
      },
    },
  );
  await rewriter.transform(new Response(html)).arrayBuffer();
  return [openHrefs, infoHrefs];
}
