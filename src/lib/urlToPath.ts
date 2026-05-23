/** PukiWiki が記事リンクに使うプレフィックス。 */
const ARTICLE_HREF_PREFIX = "./?";

/**
 * `./?PageName` 形式の href からページ名（デコード済み）を取得する。
 * 操作URL（`=` を含む）の場合は null を返す。
 */
export function articleHrefToPageName(href: string): string | null {
  if (!href.startsWith(ARTICLE_HREF_PREFIX)) return null;
  const raw = href.slice(ARTICLE_HREF_PREFIX.length);
  if (!raw || raw.includes("=")) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * `./?PageName` 形式の href から URL エンコード済みのページ名を取得する。
 * 操作URL（`=` を含む）の場合は null を返す。
 */
export function articleHrefToRawPageName(href: string): string | null {
  if (!href.startsWith(ARTICLE_HREF_PREFIX)) return null;
  const raw = href.slice(ARTICLE_HREF_PREFIX.length);
  if (!raw || raw.includes("=")) return null;
  return raw;
}

/** `?plugin=attach&pcmd=open/info` 形式の href を保存パスに変換する。 */
export function attachmentHrefToPath(href: string): string | null {
  if (!href.startsWith("?")) return null;
  const query = href.slice(1);
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
      return `${decodedRefer}/_attachments/${decodedAge}/${decodedFile}`;
    }
    if (pcmd === "info") {
      return `${decodedRefer}/_attachments/_info/${decodedAge}/${decodedFile}/index.html`;
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
      path: `${pageName}/edit.html`,
      label: "編集",
    },
    {
      url: `?cmd=freeze&page=${rawPageName}`,
      path: `${pageName}/freeze.html`,
      label: "凍結",
    },
    {
      url: `?cmd=diff&page=${rawPageName}`,
      path: `${pageName}/diff.html`,
      label: "差分",
    },
    {
      url: `?plugin=attach&pcmd=upload&page=${rawPageName}`,
      path: `${pageName}/attach.html`,
      label: "添付",
    },
    {
      url: `?plugin=related&page=${rawPageName}`,
      path: `${pageName}/backlinks.html`,
      label: "Backlinks",
    },
  ] as const;
}
