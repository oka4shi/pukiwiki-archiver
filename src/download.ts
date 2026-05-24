import { configs } from "./config";
import { createFetcher } from "./lib/fetch";
import {
  downloadListPages,
  downloadCommonPages,
} from "./download/common-pages";
import { downloadArticles } from "./download/articles";
import { downloadAttachments } from "./download/attachments";
import { downloadAttachmentInfos } from "./download/attachment-infos";

const { baseUrl } = configs;
if (!baseUrl) {
  console.error("BASE_URL が設定されていません");
  process.exit(1);
}

const fetcher = createFetcher(baseUrl, configs.basicAuth);

const { articleHrefs, attachmentOpenHrefs, attachmentInfoHrefs } =
  await downloadListPages(fetcher, configs.delayMs);
await downloadCommonPages(fetcher, configs.delayMs);
await downloadArticles(fetcher, articleHrefs, configs.delayMs);
await downloadAttachments(fetcher, attachmentOpenHrefs, configs.delayMs);
await downloadAttachmentInfos(fetcher, attachmentInfoHrefs, configs.delayMs);

console.log("\n全て完了しました。");
