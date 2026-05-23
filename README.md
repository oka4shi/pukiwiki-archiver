# pukiwiki-archiver

## 概要

PukiWikiのページをクローリングして、ローカルにHTMLファイルとして保存するアーカイブツール

## 使い方

[Bun](https://bun.com)が必要です。

1. 依存関係をインストール

```bash
bun install
```

2. 全てのページをダウンロード

```bash
bun run download
```

3. ダウンロード済みのファイルのリンクなどを変換

```bash
bun run convert
```

## アーカイブ後のページの構成

以下では、アーカイブ対象が `https://wiki.example.com/` だと仮定する。

### リストページ

以下のURLのページが取得される。保存されるURLは、以下のルールに従って変換される。

- ページの一覧: `https://wiki.example.com/?cmd=list` -> `/list.html`
- ページファイルの一覧: `https://wiki.example.com/?cmd=filelist` -> `/filelist.html`
- 全ページの添付ファイル一覧: `https://wiki.example.com/?plugin=attach&pcmd=list` -> `/attachlist.html`
- RecentChanges: `https://wiki.example.com/?RecentChanges` -> `/RecentChanges/index.html`

### 記事ページ

「ページの一覧」(`https://wiki.example.com/?cmd=list`)にある記事リンク（`div#contents > div#body > ul > li > ul > li > a`）の先のページが取得される。保存される記事のURLは、以下のルールに従って変換される。

- `/?記事名` のパスは `/articles/記事名/index.html` に置き換えられる。サブページの場合はサブディレクトリとして扱われる。
- 例: `/?すごい記事` -> `/articles/すごい記事/index.html`
- 例: `/?親記事/サブページ` -> `/articles/親記事/サブページ/index.html`

#### 各記事の操作ページ

各ページのナビゲーション(`div#navigator`)にあるそれぞれの名前のリンク先のページが取得される。
保存するファイル名は、以下のルールに従って変換される。

- 編集: `/?cmd=edit&page=記事名` -> `/articles/記事名/edit.html`
- 凍結: `/?cmd=freeze&page=記事名` -> `/articles/記事名/freeze.html`
- 差分: `/?cmd=diff&page=記事名` -> `/articles/記事名/diff.html`
- 添付: `/?plugin=attach&pcmd=upload&page=記事名` -> `/articles/記事名/attach.html`

#### 各記事のBacklinksページ

各ページのヘッダーにある最後のリンク(`div#header > h1.title > a:last-child`)の先のページが取得される。保存されるURLは、以下のルールに従って変換される。

- `/?plugin=related&page=記事名` -> `/articles/記事名/backlinks.html`

### 添付ファイル

「全ページの添付ファイル一覧」(`https://wiki.example.com/?plugin=attach&pcmd=list`)にあるファイル名(`div#contents > div#body > ul > li > ul li > a`)の、`pcmd=open`を含むリンク先のファイルが取得される。保存される添付ファイルのURLは、以下のルールに従って変換される。

- `/?plugin=attach&pcmd=open&file=ファイル名&refer=記事名` -> `/attachments/記事名/_attachments/0/ファイル名`
- `/?plugin=attach&pcmd=open&file=ファイル名&refer=記事名&age=世代` -> `/attachments/記事名/_attachments/世代/ファイル名`

### 添付ファイルの詳細ページ

「全ページの添付ファイル一覧」(`https://wiki.example.com/?plugin=attach&pcmd=list`)にあるファイル名(`div#contents > div#body > ul > li > ul li > a`)の、`pcmd=info`を含むリンク先のページが取得される。保存されるURLは、以下のルールに従って変換される。

- `/?plugin=attach&pcmd=info&file=ファイル名&refer=記事名` -> `/attachments/記事名/_info/0/ファイル名/index.html`
- `/?plugin=attach&pcmd=info&file=ファイル名&refer=記事名&age=世代` -> `/attachments/記事名/_info/世代/ファイル名/index.html`
