import * as path from "path";

/**
 * ダウンロード済みのHTML内のリンクを、相対パスから絶対パスに変換する
 */

/**
 * 現在のHTMLファイルのパスから、指定されたhrefが指す実際のファイルパスを計算する
 * @param href - HTMLに書かれているhref
 * @param currentFilePath - 現在のHTMLファイルのフルパス
 * @param baseDir - アーカイブのルートディレクトリ（絶対パス）
 * @returns 相対URL、またはローカルファイルパス。外部URLの場合はそのまま返す
 */
export function resolveHref(
  href: string,
  currentFilePath: string,
  baseDir: string,
): string {
  // 外部URL、スキーム付きURLをスキップ
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  // アンカーリンクのみの場合はそのまま返す
  if (href.startsWith("#")) {
    return href;
  }

  // プロトコル相対URLはスキップ
  if (href.startsWith("//")) {
    return href;
  }

  // 現在のファイルの親ディレクトリを基点にした相対パスを解決
  const currentDir = path.dirname(currentFilePath);
  const absolutePath = path.resolve(currentDir, href);

  // baseDir の外のパスへのリンクは変換しない
  if (!absolutePath.startsWith(baseDir)) {
    return href;
  }

  // baseDir からの相対パスに変換
  const relativePath = path.relative(currentDir, absolutePath);

  return relativePath;
}

/**
 * HTMLRewriter を使ってHTMLのリンク属性を変換するハンドラー
 */
class LinkRewriter {
  constructor(
    private currentFilePath: string,
    private baseDir: string,
  ) {}

  element = (element: HTMLRewriterTypes.Element) => {
    // href 属性が存在するかチェック
    const href = element.getAttribute("href");
    if (href) {
      const resolvedHref = resolveHref(
        href,
        this.currentFilePath,
        this.baseDir,
      );
      element.setAttribute("href", resolvedHref);
    }

    // src 属性も処理（img, script など）
    const src = element.getAttribute("src");
    if (src) {
      const resolvedSrc = resolveHref(src, this.currentFilePath, this.baseDir);
      element.setAttribute("src", resolvedSrc);
    }
  };
}

/**
 * HTMLファイルのリンクを変換してそのまま上書き
 * @param filePath - HTMLファイルのフルパス
 * @param baseDir - アーカイブのルートディレクトリ（絶対パス）
 */
export async function convertLinksInFile(
  filePath: string,
  baseDir: string,
): Promise<void> {
  const rewriter = new LinkRewriter(filePath, baseDir);

  const rewriterStream = new HTMLRewriter();
  // a タグと img, script などの要素を処理
  rewriterStream
    .on("a", rewriter)
    .on("img", rewriter)
    .on("script", rewriter)
    .on("link", rewriter)
    .on("source", rewriter);

  const file = Bun.file(filePath);
  const response = new Response(file);
  const transformed = rewriterStream.transform(response);
  await Bun.write(filePath, transformed);
}
