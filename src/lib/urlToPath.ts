/** PukiWiki が記事リンクに使うプレフィックス。 */
const ARTICLE_HREF_PREFIX = "./?";
const FRONTPAGE_HREF_PREFIX = "./";

/** HTML エンティティをデコードする。 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
/**
 * `./?PageName` または `./`(FrontPage) 形式の href からページ名（デコード済み）を取得する。
 * 操作URL（`=` を含む）の場合は null を返す。
 * URLパラメータの + をスペースに変換してから decodeURIComponent を実行する。
 */
export function articleHrefToPageName(href: string): string | null {
  // FrontPage の場合
  if (href === FRONTPAGE_HREF_PREFIX) {
    return "FrontPage";
  }

  if (!href.startsWith(ARTICLE_HREF_PREFIX)) return null;
  const raw = href.slice(ARTICLE_HREF_PREFIX.length);
  if (!raw || raw.includes("=")) return null;
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

/**
 * `./?PageName` または `./`(FrontPage) 形式の href から URL エンコード済みのページ名を取得する。
 * 操作URL（`=` を含む）の場合は null を返す。
 */
export function articleHrefToRawPageName(href: string): string | null {
  // FrontPage の場合
  if (href === FRONTPAGE_HREF_PREFIX) {
    return "FrontPage";
  }

  if (!href.startsWith(ARTICLE_HREF_PREFIX)) return null;
  const raw = href.slice(ARTICLE_HREF_PREFIX.length);
  if (!raw || raw.includes("=")) return null;
  return raw;
}

/** `./?plugin=attach&pcmd=open/info` 形式の href を保存パスに変換する。 */
export function attachmentHrefToPath(href: string): string | null {
  // HTML エンティティをデコード
  const decodedHref = decodeHtmlEntities(href);

  if (!decodedHref.startsWith(ARTICLE_HREF_PREFIX)) return null;
  const query = decodedHref.slice(ARTICLE_HREF_PREFIX.length);
  if (!query.includes("=")) return null;
  try {
    const params = new URLSearchParams(query);
    const plugin = params.get("plugin");
    const pcmd = params.get("pcmd");
    const file = params.get("file");
    const refer = params.get("refer");
    const age = params.get("age") ?? "0";

    if (plugin !== "attach" || !file || !refer) return null;

    const decodedFile = decodeURIComponent(file);
    const decodedRefer = decodeURIComponent(refer);
    const decodedAge = decodeURIComponent(age);

    if (pcmd === "open") {
      return `attachments/${decodedRefer}/_attachments/${decodedAge}/${decodedFile}`;
    }
    if (pcmd === "info") {
      return `attachments/${decodedRefer}/_info/${decodedAge}/${decodedFile}/index.html`;
    }
  } catch {
    // 無効な URL はスキップ
  }
  return null;
}
export function pageNameToOperations(
  pageName: string,
  rawPageName: string, // URL エンコード済みページ名（href から取り出したもの）
) {
  return [
    {
      url: `?cmd=edit&page=${rawPageName}`,
      path: `articles/${pageName}/edit.html`,
      label: "編集",
    },
    {
      url: `?cmd=freeze&page=${rawPageName}`,
      path: `articles/${pageName}/freeze.html`,
      label: "凍結",
    },
    {
      url: `?cmd=diff&page=${rawPageName}`,
      path: `articles/${pageName}/diff.html`,
      label: "差分",
    },
    {
      url: `?cmd=backup&page=${rawPageName}`,
      path: `articles/${pageName}/backup.html`,
      label: "履歴",
    },
    {
      url: `?plugin=attach&pcmd=upload&page=${rawPageName}`,
      path: `articles/${pageName}/attach.html`,
      label: "添付",
    },
    {
      url: `?plugin=related&page=${rawPageName}`,
      path: `articles/${pageName}/backlinks.html`,
      label: "Backlinks",
    },
  ] as const;
}
