type FetchResult =
  | { success: true; response: Response }
  | { success: false; error: { message: string; status?: number } };

export type Fetcher = ReturnType<typeof createFetcher>;

export const createFetcher = (
  baseUrl: string,
  basicAuth?: { username?: string; password?: string },
) => {
  // 共通のフェッチ処理（成功時は Response を、失敗時は統一されたエラー構造を返す）
  return async (path: string): Promise<FetchResult> => {
    try {
      const credentials =
        basicAuth?.username && basicAuth.password
          ? btoa(`${basicAuth.username}:${basicAuth.password}`)
          : null;
      const options: RequestInit = {
        headers: {
          ...(credentials ? { Authorization: `Basic ${credentials}` } : {}),
        },
      };
      const url = new URL(path, baseUrl);
      const response = await fetch(url.toString(), options);

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: `HTTP error! status: ${String(response.status)}`,
            status: response.status,
          },
        };
      }
      return { success: true, response };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  };
};
