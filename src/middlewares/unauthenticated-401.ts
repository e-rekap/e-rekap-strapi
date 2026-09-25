/**
 * Middleware `global::unauthenticated-401`
 *
 * Bawaan users-permissions: request tanpa token diperlakukan sebagai role Public, jadi route
 * yang butuh login membalas 403. Middleware ini mengubahnya menjadi 401 untuk path yang
 * didaftarkan di config (`paths`: daftar regex), hanya jika request tidak membawa token.
 */

export default (config: { paths?: string[] } = {}) => {
  const patterns = (config.paths ?? []).map((p) => new RegExp(p));

  return async (ctx: any, next: () => Promise<void>) => {
    await next();

    if (
      ctx.status === 403 &&
      !ctx.state.user &&
      !ctx.request.headers.authorization &&
      patterns.some((re) => re.test(ctx.path))
    ) {
      ctx.unauthorized('Please log in first');
    }
  };
};
