// Cucumber-js configuration for AIRE behaviour tests.
// AIRE_STORY_KEY selects which feature file runs (B1 = this unit's own feature).
const storyKey = process.env.AIRE_STORY_KEY;

const paths = storyKey
  ? [`spec/behavior/${storyKey}.feature`]
  : ["spec/behavior/**/*.feature"];

export default {
  import: ["tests/behavior/steps/**/*.js"],
  paths,
  format: ["progress"],
};
