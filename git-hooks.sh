#!/bin/sh

case "$1" in
    -l|--link)
        ln -sf ../../.githooks/prepare-commit-msg .git/hooks/prepare-commit-msg
        ln -sf ../../.githooks/pre-commit .git/hooks/pre-commit
        ;;
    -d|--delink)
        rm .git/hooks/prepare-commit-msg
        rm .git/hooks/pre-commit
        ;;
    *)
        echo "
    sh git-hooks.sh [[-l | --link] | [-d | --delink]]

    Sets up Git Hooks for project workflow.

    --link   - Links Git hooks to hooks in .git-hooks directory
    --delink - Unlinks it hooks, useful during a rebase
"
        ;;
esac

