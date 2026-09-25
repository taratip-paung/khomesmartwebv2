-- S2.4: daily cap on Google Solar API calls, persisted so a restart does not reset it.
-- Stores only a counter per Bangkok day — no Solar API content (Google policy: no caching).
CREATE TABLE api_daily_usage (
  day   date    NOT NULL,          -- Asia/Bangkok calendar day
  api   text    NOT NULL,          -- 'solar_building_insights'
  used  integer NOT NULL DEFAULT 0 CHECK (used >= 0),
  PRIMARY KEY (day, api)
);
