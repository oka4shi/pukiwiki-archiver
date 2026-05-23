import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  resolveHrefToRelativePath,
  resolveHrefToAbsolutePath,
  convertLinksToRelativePath,
  convertLinksToAbsolutePath,
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
    const currentFile = "/tmp/archive/articles/Test/index.html";

    it("should keep external URLs unchanged", () => {
      const href = "https://example.com/page";
      expect(resolveHrefToAbsolutePath(href, currentFile, archiveBase)).toBe(
        href,
      );
    });

    it("should convert relative links to absolute paths", () => {
      const href = "edit.html";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/tmp/archive/articles/Test/edit.html");
    });

    it("should resolve links to parent directory", () => {
      const href = "../OtherArticle/index.html";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/tmp/archive/articles/OtherArticle/index.html");
    });

    it("should resolve links to root", () => {
      const href = "../../list.html";
      const result = resolveHrefToAbsolutePath(href, currentFile, archiveBase);
      expect(result).toBe("/tmp/archive/list.html");
    });
  });

  describe("convertLinksToRelativePath", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "convert-test-"));
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    });

    it("should convert href attributes to relative paths", async () => {
      const htmlPath = path.join(tempDir, "test.html");
      const html = '<a href="edit.html">Edit</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksToRelativePath(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain('href="edit.html"');
    });

    it("should preserve external URLs", async () => {
      const htmlPath = path.join(tempDir, "test.html");
      const html = '<a href="https://example.com">External</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksToRelativePath(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain("https://example.com");
    });
  });

  describe("convertLinksToAbsolutePath", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "convert-test-"));
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    });

    it("should convert href attributes to absolute paths", async () => {
      const articlesDir = path.join(tempDir, "articles", "Test");
      fs.mkdirSync(articlesDir, { recursive: true });

      const htmlPath = path.join(articlesDir, "index.html");
      const html = '<a href="edit.html">Edit</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksToAbsolutePath(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain(`href="${path.join(articlesDir, "edit.html")}"`);
    });

    it("should preserve external URLs", async () => {
      const htmlPath = path.join(tempDir, "test.html");
      const html = '<a href="https://example.com">External</a>';
      fs.writeFileSync(htmlPath, html, "utf-8");

      await convertLinksToAbsolutePath(htmlPath, tempDir);

      const result = fs.readFileSync(htmlPath, "utf-8");
      expect(result).toContain("https://example.com");
    });
  });
});
