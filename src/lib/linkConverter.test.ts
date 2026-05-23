import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { resolveHref, convertLinksInFile } from "./linkConverter.ts";

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
      expect(result).toBe("../../../outside/file.html");
    });
  });

  describe("convertLinksInFile", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "convert-test-"));
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    });

    it("should convert href attributes in anchor tags", async () => {
      const htmlPath = path.join(tempDir, "test.html");
      const html = '<a href="edit.html">Edit</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksInFile(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain('href="edit.html"');
    });

    it("should convert src attributes in img tags", async () => {
      const articlesDir = path.join(tempDir, "articles", "Test");
      fs.mkdirSync(articlesDir, { recursive: true });

      const html =
        '<img src="../../attachments/Test/_attachments/0/image.jpg" />';
      const htmlFullPath = path.join(articlesDir, "index.html");
      fs.writeFileSync(htmlFullPath, html, "utf-8");

      await convertLinksInFile(htmlFullPath, tempDir);

      const result = fs.readFileSync(htmlFullPath, "utf-8");
      expect(result).toContain("src=");
      expect(result).toContain("image.jpg");
    });

    it("should preserve external URLs", async () => {
      const htmlPath = path.join(tempDir, "test.html");
      const html = '<a href="https://example.com">External</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksInFile(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain("https://example.com");
    });

    it("should preserve anchor links", async () => {
      const htmlPath = path.join(tempDir, "test.html");
      const html = '<a href="#section">Section</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksInFile(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain("#section");
    });

    it("should handle multiple links in the same document", async () => {
      const articlesDir = path.join(tempDir, "articles", "Test");
      fs.mkdirSync(articlesDir, { recursive: true });

      const html = `
        <a href="edit.html">Edit</a>
        <a href="diff.html">Diff</a>
        <img src="../../attachments/Test/_attachments/0/image.jpg" />
      `;
      const htmlFullPath = path.join(articlesDir, "index.html");
      fs.writeFileSync(htmlFullPath, html, "utf-8");

      await convertLinksInFile(htmlFullPath, tempDir);

      const result = fs.readFileSync(htmlFullPath, "utf-8");
      expect(result).toContain("edit.html");
      expect(result).toContain("diff.html");
      expect(result).toContain("image.jpg");
    });
  });
});
