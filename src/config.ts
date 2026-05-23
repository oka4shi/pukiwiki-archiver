export const OUTPUT_DIR = "dist";

export const configs = {
  baseUrl: Bun.env.BASE_URL,
  basicAuth: {
    username: Bun.env.BASIC_USERNAME,
    password: Bun.env.BASIC_PASSWORD,
  },
  delayMs: Number(Bun.env.DELAY_MS ?? "1000"),
} as const;
