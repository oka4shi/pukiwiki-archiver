import * as path from "path";

/**
 * ダウンロード済みのHTML内のリンクを相対パスに変換する
 */

/**
 * 現在のHTMLファイルのパスから、指定されたhrefが指す実際のファイルパスを計算する
 * @param href - HTMLに書かれているhref
 * @param currentFileAbsolutePath - 現在のHTMLファイルの絶対パス
 * @param archiveBaseAbsolutePath - アーカイブのルートディレクトリの絶対パス
 * @returns 相対URL（相対パス変換モード）、または絶対URL。外部URLの場合はそのまま返す
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

  // 現在のファイルの親ディレクトリを基点にした相対パスを解決
  const currentDir = path.dirname(currentFileAbsolutePath);
  const absolutePath = path.resolve(currentDir, href);

  // archiveBaseAbsolutePath の外のパスへのリンクは変換しない
  if (!absolutePath.startsWith(archiveBaseAbsolutePath)) {
    return href;
  }

  // currentDir からの相対パスに変換
  const relativePath = path.relative(currentDir, absolutePath);

  return relativePath;
}

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

  // ./?で始まるPukiWiki URLの解析
  if (href.startsWith("./?")) {
    const queryPart = href.substring(3); // "./?" を削除

    // URLパラメータをパース
    const urlParams = new URLSearchParams(queryPart);

    // cmd パラメータの処理
    const cmd = urlParams.get("cmd");
    if (cmd === "list") {
      return "/list.html";
    }
    if (cmd === "filelist") {
      return "/filelist.html";
    }
    if (cmd) {
      // cmd=edit&page=TestPage -> /articles/TestPage/edit.html
      // cmd=freeze&page=TestPage -> /articles/TestPage/freeze.html
      // cmd=diff&page=TestPage -> /articles/TestPage/diff.html
      const page = urlParams.get("page");
      if (page) {
        return `/articles/${page}/${cmd}.html`;
      }
    }

    // plugin パラメータの処理
    const plugin = urlParams.get("plugin");
    if (plugin === "attach") {
      const pcmd = urlParams.get("pcmd");
      const file = urlParams.get("file");
      const refer = urlParams.get("refer");
      const age = urlParams.get("age") ?? "0";

      if (pcmd === "list") {
        return "/attachlist.html";
      }

      if (pcmd === "open" && file && refer) {
        // ./?plugin=attach&pcmd=open&file=file.jpg&refer=TestPage
        // -> /attachments/TestPage/_attachments/0/file.jpg
        return `/attachments/${refer}/_attachments/${age}/${file}`;
      }

      if (pcmd === "info" && file && refer) {
        // ./?plugin=attach&pcmd=info&file=file.jpg&refer=TestPage
        // -> /attachments/TestPage/_info/0/file.jpg/index.html
        return `/attachments/${refer}/_info/${age}/${file}/index.html`;
      }

      if (pcmd === "upload") {
        const page = urlParams.get("page");
        if (page) {
          return `/articles/${page}/attach.html`;
        }
      }
    }

    if (plugin === "related") {
      const page = urlParams.get("page");
      if (page) {
        return `/articles/${page}/backlinks.html`;
      }
    }

    // ページ参照（ページ名のみ）
    if (queryPart && !urlParams.has("cmd") && !urlParams.has("plugin")) {
      // 特殊ページの処理
      if (queryPart === "RecentChanges") {
        return `/RecentChanges/index.html`;
      }
      // 通常の記事
      // ./?SubPage/ArticleName -> /articles/SubPage/ArticleName/
      return `/articles/${queryPart}/`;
    }
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
 * HTMLRewriter を使ってHTMLのリンク属性を変換するハンドラー（相対パス変換）
 */
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
