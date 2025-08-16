#!/bin/sh

case "$1" in
    -l|--link)
        cd .git/hooks
        ln -sf ../../.githooks/prepare-commit-msg .
        rm prepare-commit-msg.sample
        cd ../../
        ;;
    -d|--delink)
        cd .git/hooks
        rm prepare-commit-msg
        cd ../../
        ;;
    *)
        echo "
    sh git-hooks.sh [--link|--delink]

    Sets up Git Hooks for project workflow.

    --link - Links Git hooks to hooks in .git-hooks directory
    --delink - Unlinks it hooks, useful during a rebase
"
        ;;
esac

