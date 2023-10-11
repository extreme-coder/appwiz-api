'use strict';

/**
 * edit controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::edit.edit', ({ strapi }) => ({
  async generateRating(ctx) {
    const ratings = ["A+", "A", "A-", "B+", "B", "B-", "C+"]
    const { essay } = ctx.request.body;
    const matchingEdits = await strapi.entityService.findMany("api::edit.edit", { filters: { essay: essay } });
    if (matchingEdits.length > 0) {
      const edit = matchingEdits[0];
      return { rating: edit.rating };
    } else {
      return { rating: ratings[Math.floor(Math.random() * ratings.length)] };
    }
  }
}));
