const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  '*/1 * * * *': async ({ strapi }) => {
    //create stripe product and price
    const plans = await strapi.entityService.findMany('api::plan.plan', {
      filters: {priceId: null}
    })
    plans.forEach(async (plan) => {
      console.log(plan)
      const product = await stripe.products.create({
        name: (plan.name ? plan.name : plan.id.toString()),
      });

      const price = await stripe.prices.create({
        unit_amount: plan.price*100,
        currency: 'usd',
        product: product.id,
      });

      await strapi.entityService.update('api::plan.plan', plan.id, {
        data: {priceId: price.id}
      })
    })
    console.log("called")
  }
};