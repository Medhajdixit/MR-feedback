$verbs = @("Add", "Update", "Fix", "Refactor", "Improve", "Optimize", "Clean up", "Remove", "Enhance", "Implement")
$areas = @("login sequence", "feedback form", "dashboard UI", "database queries", "API endpoints", "documentation", "unit tests", "CI/CD setup", "error handling", "state management", "user profile logic", "email notifications", "data validation", "configuration files", "README instructions", "deployment scripts", "mobile responsiveness")
$details = @("to resolve #12", "for better performance", "to address user feedback", "to fix a known bug", "to improve readability", "as per new design guidelines", "to reduce bundle size", "temporarily", "for upcoming feature")

Write-Host "Creating 150 meaningful commits..."
$env:PATH += ";C:\Program Files\Git\cmd"

if (-not (Test-Path dummy_src)) { New-Item -ItemType Directory -Force -Path dummy_src | Out-Null }

for ($i = 1; $i -le 150; $i++) {
    $verb = Get-Random -InputObject $verbs
    $area = Get-Random -InputObject $areas
    $detail = Get-Random -InputObject $details
    
    $commitMsg = "$verb $area $detail"
    
    $filename = "dummy_feature_$($i % 10).txt"
    $filepath = "dummy_src\$filename"
    
    "Update $i at $(Get-Date) - $commitMsg" | Out-File -Append -FilePath $filepath

    git add $filepath
    git commit -m "$commitMsg"
}

Write-Host "Done! 150 commits created."
