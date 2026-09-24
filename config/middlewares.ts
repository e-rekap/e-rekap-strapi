import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::unauthenticated-401',
    config: {
      paths: ['^/api/my-job(/pending)?$', '^/api/my-job/[^/]+/(start|notes|complete|take-over)$'],
    },
  },
];

export default config;
