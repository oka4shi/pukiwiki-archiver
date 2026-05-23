/**
 * `?PageName` 形式の href からページ名（デコード済み）を取得する。
 * 操作URL（`=` を含む）の場合は null を返す。
 */
export function articleHrefToPageName(href: string): string | null {
  if (!href.startsWith("?")) return null;
  const raw = href.slice(1);
  if (!raw || raw.includes("=")) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** ページ名（デコード済み）から各操作URLとその保存パスのマップを生成する。 */
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
