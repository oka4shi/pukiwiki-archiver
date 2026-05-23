export const configs = {
  baseUrl: Bun.env.BASE_URL,
  basicAuth: {
    username: Bun.env.BASIC_USERNAME,
    password: Bun.env.BASIC_PASSWORD,
  },
} as const;
