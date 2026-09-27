/**
 * job-history router
 */

import { factories } from "@strapi/strapi";

// Cuma boleh BACA lewat API. Route create/update/delete gak dibikin sama sekali
export default factories.createCoreRouter("api::job-history.job-history", {
  only: ["find", "findOne"],
});