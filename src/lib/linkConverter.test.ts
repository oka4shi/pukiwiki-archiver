import { describe, expect, it } from "bun:test";
import {
  resolveHrefToRelativePath,
  resolveHrefToAbsolutePath,
} from "./linkConverter.ts";

describe("linkConverter", () => {
  describe("resolveHrefToRelativePath", () => {
    const archiveBase = "/tmp/archive";
    const currentFile = "/tmp/archive/articles/Test/index.html";

    it("should keep external URLs unchanged", () => {
      const href = "https://example.com/page";
      expect(resolveHrefToRelativePath(href, currentFile, archiveBase)).toBe(
        href,
      );
    });

    it("should keep anchor links unchanged", () => {
      const href = "#section";
      expect(resolveHrefToRelativePath(href, currentFile, archiveBase)).toBe(
        href,
      );
    });

    it("should keep protocol-relative URLs unchanged", () => {
      const href = "//example.com/page";
      expect(resolveHrefToRelativePath(href, currentFile, archiveBase)).toBe(
        href,
      );
    });

    it("should resolve relative links in the same directory", () => {
      const href = "edit.html";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toBe("edit.html");
    });

    it("should resolve relative links to parent directory", () => {
      const href = "../OtherArticle/index.html";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toContain("OtherArticle");
    });

    it("should resolve links to root", () => {
      const href = "../../list.html";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toContain("list.html");
    });

    it("should resolve links to attachments", () => {
      const href = "../../attachments/TestPage/_attachments/0/file.jpg";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toContain("attachments");
      expect(result).toContain("file.jpg");
    });

    it("should not modify links outside base directory", () => {
      const href = "../../../outside/file.html";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toBe("../../../outside/file.html");
    });
  });

  describe("resolveHrefToAbsolutePath", () => {
    const archiveBase = "/tmp/archive";
    const currentFile = "/tmp/archive/articles/SubPage/Test/index.html";

    it("should keep external URLs unchanged", () => {
      const href = "https://example.com/page";
      expect(resolveHrefToAbsolutePath(href, currentFile, archiveBase)).toBe(
        href,
      );
    });

    // リストページ関連
    it("ページの一覧へのリンクが正しく変換できるか確認", () => {
      const href = "./?cmd=list";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/list.html");
    });

    it("ページファイルの一覧へのリンクが正しく変換できるか確認", () => {
      const href = "./?cmd=filelist";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/filelist.html");
    });

    it("全ページの添付ファイル一覧へのリンクが正しく変換できるか確認", () => {
      const href = "./?plugin=attach&pcmd=list";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/attachlist.html");
    });

    it("RecentChangesへのリンクが正しく変換できるか確認", () => {
      const href = "./?RecentChanges";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/RecentChanges/index.html");
    });

    // 記事ページ関連
    it("同階層の記事へのリンクが正しく変換できるか確認", () => {
      const href = "./?SubPage/%E8%A8%98%E4%BA%8B";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toBe("/articles/SubPage/%E8%A8%98%E4%BA%8B/");
    });

    it("一個深い階層の記事へのリンクが正しく変換できるか確認", () => {
      const href = "./?SubPage/SubSubPage/%E8%A8%98%E4%BA%8B";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toContain(
        "/articles/SubPage/SubSubPage/%E8%A8%98%E4%BA%8B/",
      );
    });

    it("一個浅い階層の記事へのリンクが正しく変換できるか確認", () => {
      const href = "./?%E8%A8%98%E4%BA%8B";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toContain("/articles/%E8%A8%98%E4%BA%8B/");
    });

    it("同階層（別サブページ）の記事へのリンクが正しく変換できるか確認", () => {
      const href = "./?SubPage2/SuperArticle";
      const result = resolveHrefToRelativePath(href, currentFile, archiveBase);
      expect(result).toContain("/articles/SubPage2/SuperArticle/");
    });

    // 各記事の操作・Backlinksページ関連
    it("各記事の編集ページへのリンクが正しく変換できるか確認", () => {
      const href = "./?cmd=edit&page=TestPage";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/articles/TestPage/edit.html");
    });

    it("各記事の凍結ページへのリンクが正しく変換できるか確認", () => {
      const href = "./?cmd=freeze&page=TestPage";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/articles/TestPage/freeze.html");
    });

    it("各記事の差分ページへのリンクが正しく変換できるか確認", () => {
      const href = "./?cmd=diff&page=TestPage";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/articles/TestPage/diff.html");
    });

    it("各記事の添付ページへのリンクが正しく変換できるか確認", () => {
      const href = "./?plugin=attach&pcmd=upload&page=TestPage";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/articles/TestPage/attach.html");
    });

    it("各記事のBacklinksページへのリンクが正しく変換できるか確認", () => {
      const href = "./?plugin=related&page=TestPage";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/articles/TestPage/backlinks.html");
    });
  });

  // 添付ファイル関連
  it("添付ファイルのURLが正しく変換されるか確認", () => {
    const href = "./?plugin=attach&pcmd=open&file=file.jpg&refer=TestPage";
    const result = resolveHrefToAbsolutePath(href, "", "");
    expect(result).toBe("/attachments/TestPage/_attachments/0/file.jpg");
  });

  it("添付ファイルのURL(世代入り)が正しく変換されるか確認", () => {
    const href =
      "./?plugin=attach&pcmd=open&file=file.jpg&refer=TestPage&age=2";
    const result = resolveHrefToAbsolutePath(href, "", "");
    expect(result).toBe("/attachments/TestPage/_attachments/2/file.jpg");
  });

  // 添付ファイル詳細ページ関連
  it("添付ファイル詳細ページのURLが正しく変換されるか確認", () => {
    const href = "./?plugin=attach&pcmd=info&file=file.jpg&refer=TestPage";
    const result = resolveHrefToAbsolutePath(href, "", "");
    expect(result).toBe("/attachments/TestPage/_info/0/file.jpg/index.html");
  });

  it("添付ファイル詳細ページのURL(世代入り)が正しく変換されるか確認", () => {
    const href =
      "./?plugin=attach&pcmd=info&file=file.jpg&refer=TestPage&age=3";
    const result = resolveHrefToAbsolutePath(href, "", "");
    expect(result).toBe("/attachments/TestPage/_info/3/file.jpg/index.html");
  });
});
