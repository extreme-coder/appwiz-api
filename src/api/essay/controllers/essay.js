'use strict';

/**
 * essay controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::essay.essay', ({ strapi }) => ({
  async generateEssay(ctx) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI();

      const { mainIdea, details } = ctx.request.body;

      // Validate request body
      if (!mainIdea || !details) {
        return ctx.badRequest('Missing required fields: mainIdea, details');
      }

      const rawResponse = await openai.chat.completions.create({
        model: "ft:gpt-3.5-turbo-0613:personal::7qnU5b8X",
        messages: [
          { role: "system", content: 'You are an expert at writing effective personal essays for college admissions.' },
          { role: "user", content: `Generate an essay from the following points: ${mainIdea},${details}` }
        ]
      });

      const rawResponseText = rawResponse.choices[0]?.message?.content?.trim();

      if (!rawResponseText) {
        throw new Error('Failed to generate initial essay');
      }

      const cleanResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: 'You are a writer and proofreader.' },
          { role: "user", content: rawResponseText + "\nThis essay is messy, please clean it up and add line breaks where it makes sense for a college admissions essay. Return the final essay only." }
        ]
      });

      const cleanResponseText = cleanResponse.choices[0]?.message?.content?.trim();

      if (!cleanResponseText) {
        throw new Error('Failed to clean up the essay');
      }

      const length = cleanResponseText.split(" ").length;
      const difference = length - 650;

      let shortResponse;

      if (difference !== 0) {
        shortResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: 'You are a writer and proofreader, that specializes in shortening essays while retaining their meaning and impact.' },
            { role: "user", content: cleanResponseText + `\nPlease find exactly ${Math.abs(difference)} words that can be removed without negatively impacting the essay, and remove them. Return the final essay only.` }
          ]
        });
      } else {
        shortResponse = cleanResponse;
      }

      const responseText = shortResponse.choices[0]?.message?.content?.trim();

      if (!responseText) {
        throw new Error('Failed to adjust the essay length');
      }

      return { essay: responseText };
    } catch (error) {
      strapi.log.error('generateEssay error:', error.message);
      return ctx.internalServerError('An error occurred while generating the essay.');
    }
  }
}));

