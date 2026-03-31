$base = "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\공존공간-사업관리"

# 1. 업무일지 자동분류 — 매일 저녁 8시
$action1 = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$base\run-autofill.bat`"" -WorkingDirectory $base
$trigger1 = New-ScheduledTaskTrigger -Daily -At "20:00"
Register-ScheduledTask -TaskName "Gongzon-Autofill" -Action $action1 -Trigger $trigger1 -Description "공존공간 업무일지 자동분류 (매일 20:00)" -Force
Write-Host "[OK] 업무일지 자동분류 — 매일 20:00"

# 2. 공과금 메일 수집 (전기+가스) — 매일 아침 9시
$action2 = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$base\run-utility.bat`"" -WorkingDirectory $base
$trigger2 = New-ScheduledTaskTrigger -Daily -At "09:00"
Register-ScheduledTask -TaskName "Gongzon-Utility" -Action $action2 -Trigger $trigger2 -Description "공존공간 공과금 메일 수집 - 전기+가스 (매일 09:00)" -Force
Write-Host "[OK] 공과금 메일 수집 (전기+가스) — 매일 09:00"

# 3. 수도요금 크롤링 — 매월 1일 아침 9시 30분
$action3 = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$base\run-water.bat`"" -WorkingDirectory $base
$trigger3 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "09:30"
# 월 1회는 Weekly 트리거로 대체 불가 → Monthly 트리거 직접 생성
$trigger3monthly = New-CimInstance -CimClass (Get-CimClass -Namespace ROOT\Microsoft\Windows\TaskScheduler -ClassName MSFT_TaskMonthlyTrigger) -ClientOnly
$trigger3monthly.DaysOfMonth = 1
$trigger3monthly.MonthsOfYear = 4095
$trigger3monthly.StartBoundary = "2026-04-01T09:30:00"
$trigger3monthly.Enabled = $true
Register-ScheduledTask -TaskName "Gongzon-Water" -Action $action3 -Trigger $trigger3monthly -Description "공존공간 수도요금 크롤링 (매월 1일 09:30)" -Force
Write-Host "[OK] 수도요금 크롤링 — 매월 1일 09:30"

Write-Host ""
Write-Host "=== 등록 완료 ==="
Write-Host "확인: schtasks /query /tn Gongzon-*"
