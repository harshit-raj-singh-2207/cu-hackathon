Get-ChildItem 'c:\codes\ai-career-copilot\frontend\src\jsx' -Recurse -Filter '*.jsx' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '#030712', '#f0f6ff'
    Set-Content $_.FullName $content -NoNewline
}
Write-Host "Done - replaced all #030712 with #f0f6ff"
