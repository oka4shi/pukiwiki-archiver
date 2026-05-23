export const configs = {
  baseUrl: Bun.env.BASE_URL,
  basicAuth: {
    username: Bun.env.USERNAME,
    password: Bun.env.PASSWORD,
  },
} as const;
