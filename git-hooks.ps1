param (
    [Alias('l', 'link')]
    [switch]$Link,
    
    [Alias('d', 'delink')]
    [switch]$Delink
)

if ($Link) {
    # Create symbolic links for Git hooks
    New-Item -ItemType SymbolicLink -Path ".git/hooks/prepare-commit-msg" -Target "../../.githooks/prepare-commit-msg" -Force
    New-Item -ItemType SymbolicLink -Path ".git/hooks/pre-commit" -Target "../../.githooks/pre-commit" -Force
}
elseif ($Delink) {
    # Remove Git hooks
    Remove-Item ".git/hooks/prepare-commit-msg" -ErrorAction SilentlyContinue
    Remove-Item ".git/hooks/pre-commit" -ErrorAction SilentlyContinue
}
else {
    # Display help information
    Write-Host @"
PowerShell git-hooks.ps1 [[-l | --link] | [-d | --delink]]

Sets up Git Hooks for project workflow.

--link   - Links Git hooks to hooks in .git-hooks directory
--delink - Unlinks it hooks, useful during a rebase
"@
}
