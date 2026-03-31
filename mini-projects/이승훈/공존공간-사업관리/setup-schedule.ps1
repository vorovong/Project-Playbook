$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\공존공간-사업관리\notion-autofill.js" -WorkingDirectory "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\공존공간-사업관리"
$trigger = New-ScheduledTaskTrigger -Daily -At "20:00"
Register-ScheduledTask -TaskName "GongzonAutofill" -Action $action -Trigger $trigger -Description "Gongzon worklog autofill" -Force
Write-Host "Done - scheduled daily at 20:00"
