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

$bootstrapModule = Join-Path $mainDir "bootstrap.psm1"
iwr https://raw.githubusercontent.com/GPII/windows/hst-2017/provisioning/Provisioning.psm1 -UseBasicParsing -OutFile $bootstrapModule
Import-Module $bootstrapModule -Verbose -Force
ri -Path $bootstrapModule -Force

# # Run all the windows provisioning scripts
# ############
$windowsProvisioningDir = Join-Path $mainDir "node_modules\gpii-windows\provisioning"
try {
    Write-OutPut "Running windows script: $($windowsProvisioningDir)\Chocolatey.ps1"
    Invoke-Expression "$($windowsProvisioningDir)\Chocolatey.ps1"
} catch {
    Write-OutPut "Chocolatey.ps1 FAILED"
    exit 1
}
try {
    Write-OutPut "Running windows script: $($windowsProvisioningDir)\Npm.ps1"
    Invoke-Expression "$($windowsProvisioningDir)\Npm.ps1"
} catch {
    Write-OutPut "Npm.ps1 FAILED"
    exit 1
}
try {
    Write-OutPut "Running windows script: $($windowsProvisioningDir)\Build.ps1"
    Invoke-Expression "$($windowsProvisioningDir)\Build.ps1 -skipNpm"
} catch {
    Write-OutPut "Build.ps1 FAILED"
    exit 1
}

$npm = "npm" -f $env:SystemDrive
Invoke-Command $npm "install" $mainDir
