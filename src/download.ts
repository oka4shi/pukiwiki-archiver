import { configs } from "./config";
import { downloadArticles } from "./download/articles";
import { downloadAttachmentInfos } from "./download/attachment-infos";
import { downloadAttachments } from "./download/attachments";
import {
  downloadCommonPages,
  downloadListPages,
} from "./download/common-pages";
import { createFetcher } from "./lib/fetch";

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
