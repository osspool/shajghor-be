import { createSanitizeSuperadminFields } from '#common/guards/superadminFields.guard.js';

export const restrictFeaturedAdvert = createSanitizeSuperadminFields(['isFeatured', 'advert']);

export default {
  restrictFeaturedAdvert,
};


