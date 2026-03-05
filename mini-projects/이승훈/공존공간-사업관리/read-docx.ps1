Add-Type -AssemblyName System.IO.Compression.FileSystem
$filePath = 'C:\Users\leeha\IR-temp.docx'
$outPath = 'C:\Users\leeha\IR-temp.txt'
$zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = [System.Text.RegularExpressions.Regex]::Replace($content, '<[^>]+>', "`n")
$text = [System.Text.RegularExpressions.Regex]::Replace($text, '(\r?\n)+', "`n")
$text = $text.Trim()
[System.IO.File]::WriteAllText($outPath, $text, [System.Text.Encoding]::UTF8)
Write-Output "Done"
