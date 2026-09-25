/**
 * POST /api/client-logs: log dari browser ke `erekap-fe-logs` (Public).
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/client-logs',
      handler: 'client-log.create',
      config: {
        auth: false,
      },
    },
  ],
};
