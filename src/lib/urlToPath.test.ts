import { describe, it, expect } from "bun:test";
import {
  articleHrefToPageName,
  pageNameToOperations,
  attachmentHrefToPath,
} from "./urlToPath";

describe("articleHrefToPageName", () => {
  it("./ は FrontPage を返す", () => {
    expect(articleHrefToPageName("./")).toBe("FrontPage");
  });

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
    // "A=B" というページ名は href では ./?A%3DB になる
    expect(articleHrefToPageName("./?A%3DB")).toBe("A=B");
  });

  it("スペースを含むページ名（+ でエンコード）をデコードして返す", () => {
    // "Hello World" というページ名は href では ./?Hello+World になることがある
    expect(articleHrefToPageName("./?Hello+World")).toBe("Hello World");
  });

  it("プラス記号を含むページ名（%2B エンコード済み）と区別する", () => {
    // "Hello+World" というページ名は href では ./?Hello%2BWorld になる
    expect(articleHrefToPageName("./?Hello%2BWorld")).toBe("Hello+World");
  });

  it("複数のスペース（+ でエンコード）を正しくデコードして返す", () => {
    // "Hello World Test" というページ名は href では ./?Hello+World+Test になる
    expect(articleHrefToPageName("./?Hello+World+Test")).toBe(
      "Hello World Test",
    );
  });

  it("スペースとプラス記号が混在するページ名を区別する", () => {
    // "Hello World+Test" というページ名は href では ./?Hello+World%2BTest になる
    expect(articleHrefToPageName("./?Hello+World%2BTest")).toBe(
      "Hello World+Test",
    );
  });
});

describe("pageNameToOperations", () => {
  it("記事の編集ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[0].path).toBe("articles/TestPage/edit.html");
  });

  it("記事の凍結ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[1].path).toBe("articles/TestPage/freeze.html");
  });

  it("記事の凍結解除ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[2].path).toBe("articles/TestPage/unfreeze.html");
  });

  it("記事の差分ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[3].path).toBe("articles/TestPage/diff.html");
  });

  it("記事の添付ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[5].path).toBe("articles/TestPage/attach.html");
  });

  it("記事の複製ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[6].path).toBe("articles/TestPage/template.html");
  });

  it("記事の名前変更ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[7].path).toBe("articles/TestPage/rename.html");
  });

  it("記事の backlinks ページパスに /articles/ プレフィックスを付ける", () => {
    const ops = pageNameToOperations("TestPage", "TestPage");
    expect(ops[8].path).toBe("articles/TestPage/backlinks.html");
  });

  it("FrontPageの操作ページパスに /articles/FrontPage プレフィックスを付ける", () => {
    const ops = pageNameToOperations("FrontPage", "FrontPage");
    // FrontPageも通常の記事と同じ方法で操作ページを生成される
    expect(ops[0].path).toBe("articles/FrontPage/edit.html");
    expect(ops[1].path).toBe("articles/FrontPage/freeze.html");
    expect(ops[2].path).toBe("articles/FrontPage/unfreeze.html");
    expect(ops[3].path).toBe("articles/FrontPage/diff.html");
    expect(ops[4].path).toBe("articles/FrontPage/backup.html");
    expect(ops[5].path).toBe("articles/FrontPage/attach.html");
    expect(ops[6].path).toBe("articles/FrontPage/template.html");
    expect(ops[7].path).toBe("articles/FrontPage/rename.html");
    expect(ops[8].path).toBe("articles/FrontPage/backlinks.html");
  });
});

describe("attachmentHrefToPath", () => {
  it("添付ファイルのパスに /attachments/ プレフィックスを付ける", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&pcmd=open&file=test.txt&refer=TestPage",
    );
    expect(path).toBe("attachments/TestPage/_attachments/0/test.txt");
  });

  it("添付ファイルの世代指定に対応する", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&pcmd=open&file=test.txt&refer=TestPage&age=3",
    );
    expect(path).toBe("attachments/TestPage/_attachments/3/test.txt");
  });

  it("添付ファイル詳細ページのパス構造を変更する", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&pcmd=info&file=test.txt&refer=TestPage",
    );
    expect(path).toBe("attachments/TestPage/_info/0/test.txt/index.html");
  });

  it("添付ファイル詳細ページの世代指定に対応する", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&pcmd=info&file=test.txt&refer=TestPage&age=2",
    );
    expect(path).toBe("attachments/TestPage/_info/2/test.txt/index.html");
  });

  it("スペースを含むファイル名と記事名を正しく処理する", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&pcmd=open&file=test+file.txt&refer=Test+Page",
    );
    expect(path).toBe("attachments/Test Page/_attachments/0/test file.txt");
  });

  it("HTML エンティティで&がエンコードされたURLをパースする", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&amp;pcmd=open&amp;file=ore.jpg&amp;refer=FrontPage",
    );
    expect(path).toBe("attachments/FrontPage/_attachments/0/ore.jpg");
  });

  it("HTML エンティティの&を含むファイル詳細ページをパースする", () => {
    const path = attachmentHrefToPath(
      "./?plugin=attach&amp;pcmd=info&amp;file=test.pdf&amp;refer=TestPage&amp;age=2",
    );
    expect(path).toBe("attachments/TestPage/_info/2/test.pdf/index.html");
  });
});
