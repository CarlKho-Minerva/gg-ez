#!/bin/bash
/opt/homebrew/bin/pandoc "$@"
printf '[WARNING] Could not fetch resource (failure-path test)\n' >&2
exit 0
