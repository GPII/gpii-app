<#
  This script renames the Windows installer according to the version received when called.
#>

param (
    [string]$provisioningDir = (Split-Path -parent $PSCommandPath), # Default to script path.
    [string]$version
)

# Turn verbose on, change to "SilentlyContinue" for default behaviour.
$VerbosePreference = "continue"

# Store the project folder of the script (root of the repo) as $projectDir.
$projectDir = (Get-Item $provisioningDir).parent.FullName

$currentName = (Get-ChildItem  -Path .\installer\ *.msi).FullName
$newName = Join-Path (Join-Path $projectDir "installer") ("GPII." + $version + ".msi")

Write-Output "Renaming the installer $currentName as $newName"
Rename-Item $currentName $newName
