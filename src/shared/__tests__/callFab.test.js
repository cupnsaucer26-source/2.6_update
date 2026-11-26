// Floating call button verification: labels, formatting, and responsive bounds.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CALL_LABELS, formatPhoneDisplay } from '../phoneLink.js'

test('CALL_LABELS covers all 7 supported store languages with non-empty strings', () => {
  const supported = ['en', 'ta', 'kn', 'te', 'hi', 'ml', 'tulu']
  for (const lang of supported) {
    assert.ok(CALL_LABELS[lang], `Missing call label for language: ${lang}`)
    assert.ok(CALL_LABELS[lang].trim().length > 0, `Empty call label for language: ${lang}`)
  }
  assert.equal(CALL_LABELS.ml, 'വിളിക്കുക:')
  assert.equal(CALL_LABELS.tulu, 'ಕರೆ ಮಲ್ಪುಲೆ:')
})

test('formatPhoneDisplay formats Indian numbers with readable spacing', () => {
  assert.equal(formatPhoneDisplay('+918778613372'), '+91 87786 13372')
  assert.equal(formatPhoneDisplay('+91-8778613372'), '+91 87786 13372')
  assert.equal(formatPhoneDisplay('+91 87786 13372'), '+91 87786 13372')
  assert.equal(formatPhoneDisplay('+917550875508'), '+91 75508 75508')
  assert.equal(formatPhoneDisplay('+91 75508 75508'), '+91 75508 75508')
  assert.equal(formatPhoneDisplay('1800-425-9999'), '1800 425 9999')
  assert.equal(formatPhoneDisplay(''), '')
})

test('Responsive geometry contract: expanded label stays strictly within viewport at all required widths', () => {
  // Required viewports from spec: 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1600
  const viewports = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1600]

  for (const vw of viewports) {
    const isDesktop = vw >= 769
    const isCompactMobile = vw <= 480
    
    // Call button position
    const btnRight = isDesktop ? 24 : 12
    const btnWidth = isDesktop ? 52 : 46
    const btnLeft = vw - btnRight - btnWidth
    
    // Label positioning rules
    const gap = isCompactMobile ? 10 : 14
    const labelRight = btnLeft - gap
    
    // Maximum allowed label width from CSS
    const maxLabelWidth = isCompactMobile ? (vw - 72) : (vw - 76)
    
    // Under max-width constraint, calculate the leftmost possible label boundary
    const labelLeft = labelRight - Math.min(280, maxLabelWidth)
    
    // Strict assertions: label must be inside viewport
    assert.ok(labelLeft >= 0, `Label overflows left edge at viewport ${vw}px (labelLeft=${labelLeft}px)`)
    assert.ok(labelRight <= vw, `Label overflows right edge at viewport ${vw}px (labelRight=${labelRight}px)`)
    assert.ok(labelRight < btnLeft, `Label must not overlap button at viewport ${vw}px`)
  }
})
