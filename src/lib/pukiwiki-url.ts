/** HTML エンティティをデコードする。 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** PukiWiki URL の型定義 */
export type PukiWikiUrl =
  | { type: "root" }
  | { type: "page"; pageName: string; rawPageName: string }
  | {
      type: "cmd";
      cmd: "edit" | "freeze" | "diff";
      page: string;
    }
  | { type: "cmd"; cmd: "list" | "filelist" }
  | { type: "cmd"; cmd: "attach"; page: string }
  | { type: "cmd"; cmd: "attachlist" }
  | { type: "plugin"; plugin: "related"; page: string }
  | {
      type: "attachment";
      pcmd: "open" | "info";
      file: string;
      refer: string;
      age: string;
    }
  | { type: "special-page"; pageName: string }
  | { type: "invalid" };

/**
 * PukiWiki 形式の href をパースする
 * 入力例：
 * - "./"
 * - "./?PageName"
 * - "./?cmd=list"
 * - "./?cmd=edit&page=TestPage"
 * - "./?plugin=attach&pcmd=open&file=X&refer=Y&age=0"
 * - "./?RecentChanges"
 */
export function parsePukiWikiUrl(href: string): PukiWikiUrl {
  // HTML エンティティをデコード
  const decodedHref = decodeHtmlEntities(href);

  // ./ (root page)
  if (decodedHref === "./") {
    return { type: "root" };
  }

  // ./?で始まるもの
  if (decodedHref.startsWith("./?")) {
    const queryPart = decodedHref.substring(3);

    if (!queryPart) {
      return { type: "root" };
    }

    const urlParams = new URLSearchParams(queryPart);

    // cmd パラメータ
    const cmd = urlParams.get("cmd");
    if (cmd === "list") {
      return { type: "cmd", cmd: "list" };
    }
    if (cmd === "filelist") {
      return { type: "cmd", cmd: "filelist" };
    }
    if (cmd === "edit" || cmd === "freeze" || cmd === "diff") {
      const page = urlParams.get("page");
      if (page) {
        return { type: "cmd", cmd, page };
      }
    }

    // plugin=attach
    if (urlParams.get("plugin") === "attach") {
      const pcmd = urlParams.get("pcmd");
      const file = urlParams.get("file");
      const refer = urlParams.get("refer");

      if ((pcmd === "open" || pcmd === "info") && file && refer) {
        const age = urlParams.get("age") ?? "0";
        return {
          type: "attachment",
          pcmd,
          file,
          refer,
          age,
        };
      }

      if (pcmd === "list") {
        return { type: "cmd", cmd: "attachlist" };
      }

      if (pcmd === "upload") {
        const page = urlParams.get("page");
        if (page) {
          return { type: "cmd", cmd: "attach", page };
        }
      }
    }

    // plugin=related
    if (urlParams.get("plugin") === "related") {
      const page = urlParams.get("page");
      if (page) {
        return { type: "plugin", plugin: "related", page };
      }
    }

    // ページ名のみ（パラメータがない場合）
    if (!urlParams.has("cmd") && !urlParams.has("plugin")) {
      // 特殊ページ
      if (queryPart === "RecentChanges") {
        return { type: "special-page", pageName: "RecentChanges" };
      }

      // 通常の記事ページ
      try {
        const decodedPageName = decodeURIComponent(
          queryPart.replace(/\+/g, " "),
        );
        return {
          type: "page",
          pageName: decodedPageName,
          rawPageName: queryPart,
        };
      } catch {
        return { type: "invalid" };
      }
    }
  }

  return { type: "invalid" };
}
