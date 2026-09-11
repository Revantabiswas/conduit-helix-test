#!/usr/bin/env bash
# Behaviour-test entrypoint (AIRE). Usage: run.sh <b1|b2|b3>
# Selects the feature-file scope for the tier and runs cucumber-js.
# AIRE_STORY_KEY must be exported to the work unit's key (e.g. story-1.1) for B1.
set -euo pipefail

TIER="${1:-b1}"

case "$TIER" in
  b1)
    # This work unit's own feature file only.
    : "${AIRE_STORY_KEY:?AIRE_STORY_KEY must be set for the B1 tier}"
    export AIRE_STORY_KEY
    exec npx cucumber-js --config cucumber.mjs
    ;;
  b2)
    # Every OTHER feature file already in the repo (cumulative regression).
    # Implemented by running all features except the current unit's own.
    unset AIRE_STORY_KEY || true
    exec npx cucumber-js --config cucumber.mjs
    ;;
  b3)
    # Epic scope: all features plus cross-unit journeys (spec/behavior.feature).
    unset AIRE_STORY_KEY || true
    exec npx cucumber-js --config cucumber.mjs "spec/behavior.feature"
    ;;
  *)
    echo "Unknown tier: $TIER (expected b1|b2|b3)" >&2
    exit 2
    ;;
esac
