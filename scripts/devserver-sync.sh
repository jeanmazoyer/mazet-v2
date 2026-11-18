#!/bin/sh
# Keeps the development checkout on the box in step with its branch. Cron cannot fire more often
# than once a minute, so its line runs this script five times, ten seconds apart:
#   * * * * * flock -n /tmp/mazet-dev-sync.lock sh -c 'for i in 1 2 3 4 5; do sh ~/mazet-dev/scripts/devserver-sync.sh; sleep 10; done'
# Source changes need nothing more than the pull: `next dev` reloads them. Dependencies and
# migrations are only applied when the container starts, so a pull that touches them restarts it.
set -eu

cd "$(dirname "$0")/.."

before=$(git rev-parse HEAD)
# Fast-forward only: this checkout is a mirror, so a pull that would need a merge means someone
# edited it by hand, and stopping there is safer than guessing which side wins.
git pull --ff-only -q
after=$(git rev-parse HEAD)

[ "$before" = "$after" ] && exit 0

if git diff --name-only "$before" "$after" |
	grep -qE '^(pnpm-lock\.yaml|package\.json|drizzle/|docker-compose\.devserver\.yml$)'; then
	docker compose -p mazet-dev -f docker-compose.devserver.yml up -d --force-recreate
fi
