import { describe, expect, it } from "bun:test";
import { resolveHref, convertLinksInHtml } from "./linkConverter.ts";

describe("linkConverter", () => {
  describe("resolveHref", () => {
    const baseDir = "/tmp/archive";
    const currentFilePath = "/tmp/archive/articles/Test/index.html";

    it("should keep external URLs unchanged", () => {
      const href = "https://example.com/page";
      expect(resolveHref(href, currentFilePath, baseDir)).toBe(href);
    });

    it("should keep anchor links unchanged", () => {
      const href = "#section";
      expect(resolveHref(href, currentFilePath, baseDir)).toBe(href);
    });

    it("should keep protocol-relative URLs unchanged", () => {
      const href = "//example.com/page";
      expect(resolveHref(href, currentFilePath, baseDir)).toBe(href);
    });

    it("should resolve relative links in the same directory", () => {
      const href = "edit.html";
      const result = resolveHref(href, currentFilePath, baseDir);
      expect(result).toBe("edit.html");
    });

    it("should resolve relative links in parent directory", () => {
      const href = "../OtherArticle/index.html";
      const result = resolveHref(href, currentFilePath, baseDir);
      expect(result).toContain("OtherArticle");
    });

    it("should resolve links from root", () => {
      const href = "../../list.html";
      const currentPath = "/tmp/archive/articles/Test/index.html";
      const result = resolveHref(href, currentPath, baseDir);
      expect(result).toContain("list.html");
    });

    it("should resolve links to attachments", () => {
      const href = "../../attachments/TestPage/_attachments/0/file.jpg";
      const result = resolveHref(href, currentFilePath, baseDir);
      expect(result).toContain("attachments");
      expect(result).toContain("file.jpg");
    });

    it("should not modify links outside base directory", () => {
      const href = "../../../outside/file.html";
      const result = resolveHref(href, currentFilePath, baseDir);
      // 外のディレクトリへのリンクは変換されない
      expect(result).toBe("../../../outside/file.html");
    });
  });

  describe("convertLinksInHtml", () => {
    const baseDir = "/tmp/archive";

    it("should convert href attributes in anchor tags", async () => {
      const html = '<a href="edit.html">Edit</a>';
      const filePath = "articles/Test/index.html";
      const result = await convertLinksInHtml(html, filePath, baseDir);
      expect(result).toContain('href="edit.html"');
    });

    it("should convert src attributes in img tags", async () => {
      const html =
        '<img src="../../attachments/Test/_attachments/0/image.jpg" />';
      const filePath = "articles/Test/index.html";
      const result = await convertLinksInHtml(html, filePath, baseDir);
      expect(result).toContain("src=");
      expect(result).toContain("image.jpg");
    });

    it("should preserve external URLs", async () => {
      const html = '<a href="https://example.com">External</a>';
      const filePath = "list.html";
      const result = await convertLinksInHtml(html, filePath, baseDir);
      expect(result).toContain("https://example.com");
    });

    it("should preserve anchor links", async () => {
      const html = '<a href="#section">Section</a>';
      const filePath = "list.html";
      const result = await convertLinksInHtml(html, filePath, baseDir);
      expect(result).toContain("#section");
    });

    it("should handle multiple links in the same document", async () => {
      const html = `
        <a href="edit.html">Edit</a>
        <a href="diff.html">Diff</a>
        <img src="../../attachments/Test/_attachments/0/image.jpg" />
      `;
      const filePath = "articles/Test/index.html";
      const result = await convertLinksInHtml(html, filePath, baseDir);
      expect(result).toContain("edit.html");
      expect(result).toContain("diff.html");
      expect(result).toContain("image.jpg");
    });
  });
});
