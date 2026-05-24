# pukiwiki-archiver

## 概要

PukiWikiのページをクローリングして、ローカルにHTMLファイルとして保存するアーカイブツール

## 使い方

[Bun](https://bun.com)が必要です。使用時はBun以外への依存はありません。

### 1. 全てのページをダウンロード

記事ページ、添付ファイル、操作ページなど、アーカイブ対象のサイトの全てのページをダウンロードします。
デフォルトでは`./dist`ディレクトリに保存されます。

```bash
bun run download
```

### 2. ダウンロード済みのファイルのリンクなどを変換

ダウンロードしたhtmlファイルのリンクを変換します。

リンクを相対パスに変換する場合:

```bash
bun run convert:relative
```

リンクを絶対パスに変換する場合:

```bash
bun run convert:absolute
```

#### ディレクトリの指定

変換後のファイルは、デフォルトでは`./dist`ディレクトリから入力され、`./archive`ディレクトリに出力されます。

入力ディレクトリと出力ディレクトリを指定することもできます:

```bash
bun run convert:relative --input /path/to/input --output /path/to/output
bun run convert:absolute --input /path/to/input --output /path/to/output
```

## アーカイブ後のページの構成

以下では、アーカイブ対象が `https://wiki.example.com/` だと仮定する。

### 共通ページ

#### リストページ

以下のURLのページが取得される。保存されるURLは、以下のルールに従って変換される。

- ページの一覧: `https://wiki.example.com/?cmd=list` -> `/list.html`
- ページファイルの一覧: `https://wiki.example.com/?cmd=filelist` -> `/filelist.html`
- 全ページの添付ファイル一覧: `https://wiki.example.com/?plugin=attach&pcmd=list` -> `/attachlist.html`

#### 共通ページ

以下のURLのページが取得される。保存されるURLは、以下のルールに従って変換される。

- 新規: `https://wiki.example.com/?cmd=newpage` -> `/newpage.html` （なお、リンクの変換時には`&refer=記事名`が付いている場合は無視して`/newpage.html`に変換する）
- 検索: `https://wiki.example.com/?cmd=search` -> `/search.html`
- RecentChanges: `https://wiki.example.com/?RecentChanges` -> `/RecentChanges/index.html`
- RSS: `https://wiki.example.com/?cmd=rss` -> `/rss.xml`
- RSS(1.0): `https://wiki.example.com/?cmd=rss&ver=1.0` -> `/rss-1.0.xml`

#### アセットなど

- `https://wiki.example.com/skin/{pukiwiki.css,main.js}` -> `/skin/{pukiwiki.css,main.js}`
- `https://wiki.example.com/image/{pukiwiki.png, edit.png, file.png, file.png, file.png, file.png, top.png, edit.png, freeze.png, diff.png, backup.png, file.png, copy.png, rename.png, reload.png, new.png, list.png, search.png, recentchanges.png, help.png, rss.png}` -> `/image/{pukiwiki.png, edit.png, file.png, file.png, file.png, file.png, top.png, edit.png, freeze.png, diff.png, backup.png, file.png, copy.png, rename.png, reload.png, new.png, list.png, search.png, recentchanges.png, help.png, rss.png}`

### 記事ページ

「ページの一覧」(`https://wiki.example.com/?cmd=list`)にある記事リンク（`div#contents > div#body > ul > li > ul > li > a`）の先のページが取得される。保存される記事のURLは、以下のルールに従って変換される。

- `/?記事名` のパスは `/articles/記事名/index.html` に置き換えられる。サブページの場合はサブディレクトリとして扱われる。
- 例: `/?すごい記事` -> `/articles/すごい記事/index.html`
- 例: `/?親記事/サブページ` -> `/articles/親記事/サブページ/index.html`

#### 各記事の操作・Backlinksページ

各ページの記事名を用いて、以下のURLのページが取得される。
保存するファイル名は、以下のルールに従って変換される。

- 編集: `/?cmd=edit&page=記事名` -> `/articles/記事名/edit.html`
- 凍結: `/?cmd=freeze&page=記事名` -> `/articles/記事名/freeze.html`
- 差分: `/?cmd=diff&page=記事名` -> `/articles/記事名/diff.html`
- 履歴: `/?cmd=backup&page=記事名` -> `/articles/記事名/backup.html`
- 添付: `/?plugin=attach&pcmd=upload&page=記事名` -> `/articles/記事名/attach.html`

- 複製: `?plugin=template&refer=記事名` -> `/articles/記事名/template.html`
- 名前変更: `?plugin=rename&refer=記事名` -> `/articles/記事名/rename.html`

- Backlinks: `/?plugin=related&page=記事名` -> `/articles/記事名/backlinks.html`

### 添付ファイル

「全ページの添付ファイル一覧」(`https://wiki.example.com/?plugin=attach&pcmd=list`)にあるファイル名の直下のリンク(`div#contents > div#body > ul > li > ul li > a`)の先のファイルが取得される。保存される添付ファイルのURLは、以下のルールに従って変換される。

- `/?plugin=attach&pcmd=open&file=ファイル名&refer=記事名` -> `/attachments/記事名/_attachments/0/ファイル名`
- `/?plugin=attach&pcmd=open&file=ファイル名&refer=記事名&age=世代` -> `/attachments/記事名/_attachments/世代/ファイル名`

### 添付ファイルの詳細ページ

「全ページの添付ファイル一覧」(`https://wiki.example.com/?plugin=attach&pcmd=list`)にあるファイル名の横の小さいテキスト（[詳細]と書いてあるもの）のリンク(`div#contents > div#body > ul > li > ul li > span.small > a`)の先のページが取得される。保存されるURLは、以下のルールに従って変換される。

- `/?plugin=attach&pcmd=info&file=ファイル名&refer=記事名` -> `/attachments/記事名/_info/0/ファイル名/index.html`
- `/?plugin=attach&pcmd=info&file=ファイル名&refer=記事名&age=世代` -> `/attachments/記事名/_info/世代/ファイル名/index.html`
