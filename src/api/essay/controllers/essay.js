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

      console.log(ctx.request.body)
      const { mainIdea, details, testMode } = ctx.request.body;
      if (testMode) {
        return { essay: "This is a test essay." };
      }

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

      if (difference > 0) {
        console.log("too long")
        const sentences = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "user", content: `Rank EVERY SINGLE ONE of the sentences in this essay from most important/least cuttable to least important/most cuttable. Your response should contain a comma-separated sorted list of sentences, and nothing else.\n` + cleanResponseText }
          ]
        });
        const sentenceText = sentences.choices[0]?.message?.content?.trim();
        const sentencesToCut = sentenceText.split(" ").reverse().slice(0, difference).reverse().join(" ");
        shortResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "user", content: cleanResponseText + `\nCut the following sentences from the above essay:\n` + sentencesToCut + '\nYour response should contain only the final essay with the sentences removed, and nothing else.' }
          ]
        });
      } else {
        shortResponse = cleanResponse;
      }

      const shortResponseText = shortResponse.choices[0]?.message?.content?.trim();
      const cleanShortResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: 'You are a writer and proofreader.' },
          { role: "user", content: shortResponseText + "\nThis essay is messy, please clean it up and add line breaks where it makes sense for a college admissions essay. Return the final essay only." }
        ]
      });

      const responseText = cleanShortResponse.choices[0]?.message?.content?.trim();

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

