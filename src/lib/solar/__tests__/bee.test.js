import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BEE_SCRIPT, BEE_EVENTS, beeEvent, beeLines } from '../../../data/solar/beeScript.js'

test('bee: every step and event line exists in TH and EN', () => {
  assert.deepEqual(Object.keys(BEE_SCRIPT.th.steps).sort(), Object.keys(BEE_SCRIPT.en.steps).sort())
  assert.deepEqual(Object.keys(BEE_EVENTS.th).sort(), Object.keys(BEE_EVENTS.en).sort())
  for (const k of ['roof_flat', 'roof_gable', 'roof_hip', 'facing_north', 'sat_found', 'sat_not_found']) {
    assert.ok(beeEvent('th', k).length > 10 && beeEvent('en', k).length > 10, k)
  }
  assert.match(beeEvent('th', 'sat_found', { n: 2 }), /2 ผืน/)
  for (const s of ['locate', 'orient', 'preview', 'login']) assert.ok(beeLines('th', s).length >= 1 && beeLines('en', s).length >= 1)
})

test('bee: the preview step reminds that a site survey always comes first', () => {
  assert.ok(beeLines('th', 'preview').some((l) => l.includes('สำรวจหน้างาน')))
  assert.ok(beeLines('en', 'preview').some((l) => /survey/i.test(l)))
})
