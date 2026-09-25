-- Climate per 0.25° grid cell (NASA POWER + PVGIS-ERA5 climatology, see src/lib/solar/climate.js).
-- Both sources are free/open and may be stored (unlike Google Solar API content). Refreshed after a year.
CREATE TABLE climate_cells (
  cell        text        PRIMARY KEY,           -- '18.75,99.00'
  data        jsonb       NOT NULL,              -- buildClimate() output
  fetched_at  timestamptz NOT NULL DEFAULT now()
);
