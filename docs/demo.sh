#!/bin/bash
# Demo script for recording a GIF/asciinema
# Usage: asciinema rec demo.cast -c "bash docs/demo.sh"
# Or: terminalizer record -c "bash docs/demo.sh"

echo "$ depvibe check express"
sleep 1
node bin/depvibe.js check express
sleep 2

echo ""
echo "$ depvibe check lodash"
sleep 1
node bin/depvibe.js check lodash
sleep 2

echo ""
echo "$ depvibe check chalk --json"
sleep 1
node bin/depvibe.js check chalk --json
sleep 2

echo ""
echo "$ depvibe check --license GPL-3.0 --data test/fixtures/health.json --fail"
sleep 1
node bin/depvibe.js check --license GPL-3.0 --data test/fixtures/health.json --fail
sleep 2

echo ""
echo "$ depvibe check --license MIT --data test/fixtures/health.json"
sleep 1
node bin/depvibe.js check --license MIT --data test/fixtures/health.json