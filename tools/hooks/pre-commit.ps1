$ErrorActionPreference = "Stop"

$stagedFiles = @(git diff --cached --name-only --diff-filter=ACMR)

if ($backendPython = @($stagedFiles | Where-Object { $_ -match "^backend/.*\.py$" })) {
    & ".\backend\.venv\Scripts\ruff.exe" format @backendPython
    & ".\backend\.venv\Scripts\ruff.exe" check --fix @backendPython
    git add -- $backendPython
}

$frontendFormat = @(
    $stagedFiles |
    Where-Object { $_ -match "^webapp/.*\.(ts|tsx|js|jsx|json|css|md|html|yml|yaml)$" } |
    ForEach-Object { $_.Substring(7) }
)

if ($frontendFormat) {
    Push-Location "webapp"
    try {
        pnpm exec prettier --write @frontendFormat
    }
    finally {
        Pop-Location
    }

    $frontendFormat | ForEach-Object { "webapp/$_" } | ForEach-Object { git add -- $_ }
}

$frontendLint = @(
    $stagedFiles |
    Where-Object { $_ -match "^webapp/.*\.(ts|tsx|js|jsx|cjs|mjs)$" } |
    ForEach-Object { $_.Substring(7) }
)

if ($frontendLint) {
    Push-Location "webapp"
    try {
        pnpm exec eslint --fix @frontendLint
    }
    finally {
        Pop-Location
    }

    $frontendLint | ForEach-Object { "webapp/$_" } | ForEach-Object { git add -- $_ }
}
