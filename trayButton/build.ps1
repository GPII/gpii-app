Import-Module (Join-Path $PSScriptRoot '..\provisioning\Provisioning.psm1') -Force

$msbuild = Get-MSBuild "4.0"
Invoke-Command $msbuild "tray-button.vcxproj /p:Configuration=Release" $PSScriptRoot
