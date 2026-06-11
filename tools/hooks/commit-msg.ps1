param(
    [Parameter(Mandatory = $true)]
    [string]$CommitMsgFile
)

$ErrorActionPreference = "Stop"

node ".\node_modules\@commitlint\cli\cli.js" --edit $CommitMsgFile
