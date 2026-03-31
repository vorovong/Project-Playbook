$base = Get-Item ($PSScriptRoot)
$targetPath = Join-Path $base.FullName 'startup-all.bat'
$startupDir = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
$lnkPath = Join-Path $startupDir 'gongzon-auto.lnk'

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnkPath)
$sc.TargetPath = $targetPath
$sc.WorkingDirectory = $base.FullName
$sc.WindowStyle = 7
$sc.Save()

Write-Host ('Shortcut created: ' + $lnkPath)
Write-Host ('Target: ' + $targetPath)
