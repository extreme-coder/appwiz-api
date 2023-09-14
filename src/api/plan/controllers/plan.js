'use strict';

/**
 * plan controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const fetch = require("node-fetch");

module.exports = createCoreController('api::plan.plan', ({ strapi }) => ({
  async createSession(ctx) {
    const domainURL = process.env.DOMAIN;
    let { user, plan, urlpath } = ctx.request.body.data;

    plan = await strapi.entityService.findOne('api::plan.plan', plan, {
      populate: '*'
    })


    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    try {
      const product = await stripe.products.create({
        name: plan.name,
      });

      const price = await stripe.prices.create({
        unit_amount: 500,
        currency: 'usd',
        product: product.id,
      });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1
          },
        ],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}${urlpath}?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}${urlpath}`,
      });

      //update user stripe session id and plan
      await fetch(
        `http://localhost:1337/api/users/${user}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripe_session_id: session.id,
            plan: plan.id
          }),
        }
      )
      return ({ sessionId: session.id });
    } catch (e) {
      console.log(e.message)
      ctx.response.status = 400;
      return ({ error: { message: e.message } })
    }
  },

  async checkoutSession(ctx) {
    const { sessionId } = ctx.request.query;
    console.log(sessionId)
    let user
    const users = await fetch(
      `http://localhost:1337/api/users?filters[stripe_session_id][$eq]=${sessionId}&populate=*`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    ).then((res) => res.json());
    if (users[0]) {
      user = users[0]
    } else {
      ctx.response.status = 400;
      return ({ error: { message: 'Matching user not found' } })
    }

    console.log(user)

    const plan = await strapi.entityService.findOne('api::plan.plan', user.plan.id, {
      populate: '*'
    })

    await fetch(
      `http://localhost:1337/api/users/${user.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: user.tokens + plan.tokens,
        }),
      }
    )
  },
}));
