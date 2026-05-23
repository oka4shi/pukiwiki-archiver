import { describe, it, expect } from "bun:test";
import { articleHrefToPageName } from "./urlToPath";

describe("articleHrefToPageName", () => {
  it("ASCII ページ名を返す", () => {
    expect(articleHrefToPageName("./?FrontPage")).toBe("FrontPage");
  });

  it("URL エンコードされた日本語ページ名をデコードして返す", () => {
    // "テスト" をエンコードしたもの
    expect(articleHrefToPageName("./?%E3%83%86%E3%82%B9%E3%83%88")).toBe(
      "テスト",
    );
  });

  it("サブページのスラッシュをデコードして返す", () => {
    // "Parent/Child" をエンコードしたもの
    expect(articleHrefToPageName("./?Parent%2FChild")).toBe("Parent/Child");
  });

  it("RecentChanges を返す", () => {
    expect(articleHrefToPageName("./?RecentChanges")).toBe("RecentChanges");
  });

  it("操作URL (?cmd=...) は null を返す", () => {
    expect(articleHrefToPageName("./?cmd=list")).toBeNull();
    expect(articleHrefToPageName("./?cmd=edit&page=FrontPage")).toBeNull();
    expect(articleHrefToPageName("./?cmd=diff&page=FrontPage")).toBeNull();
  });

  it("プラグインURL (?plugin=...) は null を返す", () => {
    expect(
      articleHrefToPageName("./?plugin=attach&pcmd=upload&page=FrontPage"),
    ).toBeNull();
    expect(
      articleHrefToPageName("./?plugin=related&page=FrontPage"),
    ).toBeNull();
  });

  it("./? で始まらない文字列は null を返す", () => {
    expect(articleHrefToPageName("FrontPage")).toBeNull();
    expect(articleHrefToPageName("./FrontPage")).toBeNull();
    expect(articleHrefToPageName("https://example.com/?FrontPage")).toBeNull();
  });

  it("./? のみ（空ページ名）は null を返す", () => {
    expect(articleHrefToPageName("./?")).toBeNull();
  });

  it("空文字列は null を返す", () => {
    expect(articleHrefToPageName("")).toBeNull();
  });

  it("ページ名に = を含む場合（%3D エンコード済み）は正しくデコードして返す", () => {
    // "A=B" というページ名は href では ?A%3DB になる
    expect(articleHrefToPageName("./?A%3DB")).toBe("A=B");
  });
});
