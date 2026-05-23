import { configs } from "./config";
import { createFetcher } from "./lib/fetch";
import { downloadListPages } from "./download/list";
import { downloadArticles } from "./download/articles";
import { downloadAttachments } from "./download/attachments";

const { baseUrl } = configs;
if (!baseUrl) {
  console.error("BASE_URL が設定されていません");
  process.exit(1);
}

const fetcher = createFetcher(baseUrl, configs.basicAuth);

const { articleHrefs, attachmentHrefs } = await downloadListPages(
  fetcher,
  configs.delayMs,
);
await downloadArticles(fetcher, articleHrefs, configs.delayMs);
await downloadAttachments(fetcher, attachmentHrefs, configs.delayMs);

console.log("\n全て完了しました。");
