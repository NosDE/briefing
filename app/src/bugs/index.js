import Vue from 'vue'
import { PRODUCTION } from '../config'
import { messages } from '../lib/emitter'

const log = require('debug')('app:bugs')

// Lazy loading of bug tracker
export function setupBugTracker(done) {
  if (PRODUCTION && isAllowedBugTracking()) {
    console.log('Sentry bug tracking is allowed')
    import('./lazy-sentry').then(({ setupSentry }) => {
      setupSentry({
        dsn: 'https://5e7bc1b62da1458b8117dc68d6242746@o120938.ingest.sentry.io/5266804',
        Vue,
      })
      console.log('Did init Sentry bug tracking')
      if (done) done()
    })
  }
}

// Send bugs if user allowed to do so

let collectedErrors = []

export function isAllowedBugTracking() {
  return localStorage.allowSentry === '1'
}

export function setAllowedBugTracking(allowed = true, reloadMessage = 'Reload to activate changes') {
  log('setAllowedBugTracking', allowed)
  if (allowed) {
    localStorage.allowSentry = '1'
    setupBugTracker(_ => {
      log('setupBugTracker', collectedErrors)
      let err
      while (err = collectedErrors.pop()) {
        log('send error', err)
        trackException(err)
      }
    })
  } else {
    localStorage.allowSentry = '0'
    if (confirm(reloadMessage)) {
      location.reload()
    }
  }
}

export function trackException(e, silent = false) {
  if (!silent) {
    console.error('Exception:', e)
  }
  if (window.sentry) {
    log('sentry exception', e)
    window.sentry.captureException(e)
  } else {
    collectedErrors.push(e)
    messages.emit('requestBugTracking')
  }
}

export function trackSilentException(e) {
  trackException(e, true)
}
