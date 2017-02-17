<#
  This script installs the dependencies for gpii-app:
  1) installs nodejs via chocolatey
  2) installs the gpii-app npm dependencies
  3) runs the provisioning scripts from the (gpii-)windows repo

  If run via a tool (like vagrant) which moves this script to somewhere different
  than its original location within the gpii-app repository, the parameter
  "-originalBuildScriptPath" should be provided, with the original location of the
  script
#>

param (
    [string]$originalBuildScriptPath = (Split-Path -parent $PSCommandPath) # Default to script path.
)

# Turn verbose on, change to "SilentlyContinue" for default behaviour.
$VerbosePreference = "continue"

# Store the parent folder of the script (root of the repo) as $mainDir
############
$mainDir = (get-item $originalBuildScriptPath).parent.FullName
Write-OutPut "mainDir set to: $($mainDir)"

# TODO: We should add this to a function or reduce to oneline.
$bootstrapModule = Join-Path $originalBuildScriptPath "Provisioning.psm1"
iwr https://raw.githubusercontent.com/GPII/windows/hst-2017/provisioning/Provisioning.psm1 -UseBasicParsing -OutFile $bootstrapModule
Import-Module $bootstrapModule -Verbose -Force

# # Run all the windows provisioning scripts
# ############
# TODO: Create function for downloading scripts and executing them.
$windowsBootstrapURL = "https://raw.githubusercontent.com/javihernandez/windows/GPII-2287/provisioning"
try {
    $choco = Join-Path $originalBuildScriptPath "Chocolatey.ps1"
    Write-OutPut "Running windows script: $choco"
    iwr "$windowsBootstrapURL/Chocolatey.ps1" -UseBasicParsing -OutFile $choco
    Invoke-Expression $choco
} catch {
    Write-OutPut "Chocolatey.ps1 FAILED"
    exit 1
}
try {
    $npm = Join-Path $originalBuildScriptPath "Npm.ps1"
    Write-OutPut "Running windows script: $npm"
    iwr "$windowsBootstrapURL/Npm.ps1" -UseBasicParsing -OutFile $npm
    Invoke-Expression $npm
} catch {
    Write-OutPut "Npm.ps1 FAILED"
    exit 1
}

$npm = "npm" -f $env:SystemDrive
Invoke-Command $npm "install" $mainDir

try {
    $tests = Join-Path $originalBuildScriptPath "Tests.ps1"
    $fullPath = Join-Path $originalBuildScriptPath "../node_modules/gpii-windows/provisioning/"
    $args = "-originalBuildScriptPath $fullPath"
    Write-OutPut "Running windows script: $tests"
    iwr "$windowsBootstrapURL/Tests.ps1" -UseBasicParsing -OutFile $tests
    Invoke-Expression "$tests $args"
} catch {
    Write-OutPut "Tests.ps1 FAILED"
    exit 1
}
