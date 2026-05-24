import * as path from "path";
import { parsePukiWikiUrl } from "./pukiwiki-url.ts";

/**
 * 現在のHTMLファイルのパスから、指定されたhrefが指す実際のファイルパスを計算する
 * @param href - HTMLに書かれているhref
 * @param currentFileAbsolutePath - 現在のHTMLファイルの絶対パス
 * @param archiveBaseAbsolutePath - アーカイブのルートディレクトリの絶対パス
 * @returns 絶対パス。外部URLの場合はそのまま返す
 */
export function resolveHrefToAbsolutePath(
  href: string,
  currentFileAbsolutePath: string,
  archiveBaseAbsolutePath: string,
): string {
  // 外部URL、スキーム付きURLをスキップ
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  // アンカーリンクのみの場合はそのまま返す
  if (href.startsWith("#")) {
    return href;
  }

  // プロトコル相対URLをスキップ
  if (href.startsWith("//")) {
    return href;
  }

  // PukiWiki URLをパース
  const pukiUrl = parsePukiWikiUrl(href);

  switch (pukiUrl.type) {
    case "root":
      return "/";

    case "cmd": {
      if (pukiUrl.cmd === "list") {
        return "/list.html";
      }
      if (pukiUrl.cmd === "filelist") {
        return "/filelist.html";
      }
      if (pukiUrl.cmd === "attachlist") {
        return "/attachlist.html";
      }
      if (pukiUrl.cmd === "new") {
        return "/new.html";
      }
      if (pukiUrl.cmd === "search") {
        return "/search.html";
      }
      if (pukiUrl.cmd === "rss") {
        return "/rss.xml";
      }
      // edit, freeze, diff, backup, attach
      const page = "page" in pukiUrl ? pukiUrl.page : "";
      return `/articles/${page}/${pukiUrl.cmd}.html`;
    }

    case "page":
      return `/articles/${pukiUrl.rawPageName}/`;

    case "special-page":
      if (pukiUrl.pageName === "RecentChanges") {
        return "/RecentChanges/index.html";
      }
      if (pukiUrl.pageName === "FrontPage") {
        return "/index.html";
      }
      return `/articles/${pukiUrl.pageName}/`;

    case "attachment": {
      const { pcmd, file, refer, age } = pukiUrl;
      if (pcmd === "open") {
        return `/attachments/${refer}/_attachments/${age}/${file}`;
      }
      // pcmd === "info"
      return `/attachments/${refer}/_info/${age}/${file}/index.html`;
    }

    case "plugin": {
      // plugin must be "related" here based on type definition
      const page = pukiUrl.page;
      return `/articles/${page}/backlinks.html`;
    }

    case "invalid":
      // ./?から始まらない ./ で始まるもの（./invalid など）は変換しない
      if (href.startsWith("./") && !href.startsWith("./?") && href !== "./") {
        return href;
      }
  }

  // 必須パラメータが空の場合は相対パスを解決しない
  if (!currentFileAbsolutePath || !archiveBaseAbsolutePath) {
    return href;
  }

  // 現在のファイルの親ディレクトリを基点にした相対パスを解決
  const currentDir = path.dirname(currentFileAbsolutePath);
  const absolutePath = path.resolve(currentDir, href);

  // archiveBaseAbsolutePath の外のパスへのリンクは変換しない
  if (!absolutePath.startsWith(archiveBaseAbsolutePath)) {
    return href;
  }

  return absolutePath;
}

/**
 * 現在のHTMLファイルのパスから、指定されたhrefが指す実際のファイルパスを計算する
 * @param href - HTMLに書かれているhref
 * @param currentFileAbsolutePath - 現在のHTMLファイルの絶対パス
 * @param archiveBaseAbsolutePath - アーカイブのルートディレクトリの絶対パス
 * @returns 相対パス。外部URLの場合はそのまま返す
 */
export function resolveHrefToRelativePath(
  href: string,
  currentFileAbsolutePath: string,
  archiveBaseAbsolutePath: string,
): string {
  // 外部URL、スキーム付きURLをスキップ
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  // アンカーリンクのみの場合はそのまま返す
  if (href.startsWith("#")) {
    return href;
  }

  // プロトコル相対URLをスキップ
  if (href.startsWith("//")) {
    return href;
  }

  // PukiWiki URLをパース
  const pukiUrl = parsePukiWikiUrl(href);

  // PukiWiki形式以外のURLはそのまま返す（変換しない）
  if (pukiUrl.type === "invalid" && !href.startsWith("./")) {
    return href;
  }

  // PukiWiki URLを絶対パスに変換してから、相対パスを計算
  const absolutePath = resolveHrefToAbsolutePath(
    href,
    currentFileAbsolutePath,
    archiveBaseAbsolutePath,
  );

  // 外部URLや相対URLはそのまま返す
  if (!absolutePath.startsWith("/")) {
    return absolutePath;
  }

  // 絶対パスから相対パスに変換
  const currentDir = path.dirname(currentFileAbsolutePath);
  const archivePath = archiveBaseAbsolutePath + absolutePath;

  // 相対パスに変換
  const relativePath = path.relative(currentDir, archivePath);

  return relativePath;
}
class RelativePathLinkRewriter {
  constructor(
    private currentFileAbsolutePath: string,
    private archiveBaseAbsolutePath: string,
  ) {}

  element = (element: HTMLRewriterTypes.Element) => {
    // href 属性が存在するかチェック
    const href = element.getAttribute("href");
    if (href) {
      const resolvedHref = resolveHrefToRelativePath(
        href,
        this.currentFileAbsolutePath,
        this.archiveBaseAbsolutePath,
      );
      element.setAttribute("href", resolvedHref);
    }

    // src 属性も処理（img, script など）
    const src = element.getAttribute("src");
    if (src) {
      const resolvedSrc = resolveHrefToRelativePath(
        src,
        this.currentFileAbsolutePath,
        this.archiveBaseAbsolutePath,
      );
      element.setAttribute("src", resolvedSrc);
    }
  };
}

/**
 * HTMLRewriter を使ってHTMLのリンク属性を変換するハンドラー（絶対パス変換）
 */
class AbsolutePathLinkRewriter {
  constructor(
    private currentFileAbsolutePath: string,
    private archiveBaseAbsolutePath: string,
  ) {}

  element = (element: HTMLRewriterTypes.Element) => {
    // href 属性が存在するかチェック
    const href = element.getAttribute("href");
    if (href) {
      const resolvedHref = resolveHrefToAbsolutePath(
        href,
        this.currentFileAbsolutePath,
        this.archiveBaseAbsolutePath,
      );
      if (resolvedHref.startsWith(this.archiveBaseAbsolutePath)) {
        console.warn(
          `Warning: Resolved absolute path "${resolvedHref}" is within the archive base directory. This may indicate an issue with the path resolution logic.`,
        );
      }
      element.setAttribute("href", resolvedHref);
    }

    // src 属性も処理（img, script など）
    const src = element.getAttribute("src");
    if (src) {
      const resolvedSrc = resolveHrefToAbsolutePath(
        src,
        this.currentFileAbsolutePath,
        this.archiveBaseAbsolutePath,
      );
      element.setAttribute("src", resolvedSrc);
    }
  };
}

/**
 * HTMLファイルのリンクを相対パスに変換してそのまま上書き
 * @param fileAbsolutePath - HTMLファイルの絶対パス
 * @param archiveBaseAbsolutePath - アーカイブのルートディレクトリの絶対パス
 */
export async function convertLinksToRelativePath(
  fileAbsolutePath: string,
  archiveBaseAbsolutePath: string,
): Promise<void> {
  const rewriter = new RelativePathLinkRewriter(
    fileAbsolutePath,
    archiveBaseAbsolutePath,
  );

  const rewriterStream = new HTMLRewriter();
  // a タグと img, script などの要素を処理
  rewriterStream
    .on("a", rewriter)
    .on("img", rewriter)
    .on("script", rewriter)
    .on("link", rewriter)
    .on("source", rewriter);

  const file = Bun.file(fileAbsolutePath);
  const response = new Response(file);
  const transformed = rewriterStream.transform(response);
  await Bun.write(fileAbsolutePath, transformed);
}

/**
 * HTMLファイルのリンクを絶対パスに変換してそのまま上書き
 * @param fileAbsolutePath - HTMLファイルの絶対パス
 * @param archiveBaseAbsolutePath - アーカイブのルートディレクトリの絶対パス
 */
export async function convertLinksToAbsolutePath(
  fileAbsolutePath: string,
  archiveBaseAbsolutePath: string,
): Promise<void> {
  const rewriter = new AbsolutePathLinkRewriter(
    fileAbsolutePath,
    archiveBaseAbsolutePath,
  );

  const rewriterStream = new HTMLRewriter();
  // a タグと img, script などの要素を処理
  rewriterStream
    .on("a", rewriter)
    .on("img", rewriter)
    .on("script", rewriter)
    .on("link", rewriter)
    .on("source", rewriter);

  const file = Bun.file(fileAbsolutePath);
  const response = new Response(file);
  const transformed = rewriterStream.transform(response);
  await Bun.write(fileAbsolutePath, transformed);
}
