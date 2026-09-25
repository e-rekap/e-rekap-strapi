import type { Core } from '@strapi/strapi';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const user = ctx.state.user;
    console.log('User:', user);

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const role = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: user.id },
        populate: ['role'],
      });

    if (role?.role?.name?.toLowerCase() !== 'admin') {
      return ctx.forbidden('Only admins can perform this action');
    }

    await next();
  };
};