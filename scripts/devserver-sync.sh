#!/bin/sh
# Keeps the development checkout on the box in step with its branch. Cron cannot fire more often
# than once a minute, so its line runs this script five times, ten seconds apart:
#   * * * * * flock -n /tmp/mazet-dev-sync.lock sh -c 'for i in 1 2 3 4 5; do sh ~/mazet-dev/scripts/devserver-sync.sh; sleep 10; done'
# The development site runs the app in domaine/. Its pages are served from the checkout, so for
# them a pull is enough. The server is another matter: it was seen still running its old code
# after a pull (its own file watching did not fire on the box), and dependencies are only
# installed when the container starts. So a pull that touches the server's code, its
# dependencies or the deployment file recreates the container.
set -eu

cd "$(dirname "$0")/.."

before=$(git rev-parse HEAD)
# Fast-forward only: this checkout is a mirror, so a pull that would need a merge means someone
# edited it by hand, and stopping there is safer than guessing which side wins.
git pull --ff-only -q
after=$(git rev-parse HEAD)

[ "$before" = "$after" ] && exit 0

if git diff --name-only "$before" "$after" |
	grep -qE '^domaine/(package-lock\.json|package\.json|docker-compose\.yml|server/.*)$'; then
	docker compose -p mazet-dev -f domaine/docker-compose.yml up -d --force-recreate
fi
