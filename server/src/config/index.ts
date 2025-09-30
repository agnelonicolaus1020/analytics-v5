export default {
  default: ({ env }) => (
    {
      attempts_enabled: env.bool("ATTEMPTS_ENABLED"),
      analytics_hours: env.int("ATTEMPTS_HOURS"),
      analytics_attempts: env.int("ATTEMPTS"),
    }
  ),
  validator() {},
};
