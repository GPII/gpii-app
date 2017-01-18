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

param ( # default to script path
    [string]$originalBuildScriptPath = (Split-Path -parent $PSCommandPath)
)

# Turn verbose on, change to "SilentlyContinue" for default behaviour.
$VerbosePreference = "continue"

# Store the parent folder of the script (root of the repo) as $mainDir
############
$mainDir = (get-item $originalBuildScriptPath).parent.FullName
Write-OutPut "mainDir set to: $($mainDir)"

# Import functions
Import-Module "$($originalBuildScriptPath)/Provisioning.psm1" -Force
Import-Module "$env:ChocolateyInstall\helpers\chocolateyInstaller.psm1" -Force -Verbose

######### SNIP ###########
# Obtain some useful paths.
$systemDrive = $env:SystemDrive
# Acquire information about the system and environment.
$winVersion = [System.Environment]::OSVersion
$OSBitness = Get-OSBitness
$processorBits = Get-ProcessorBits
Write-Verbose "Calling build in $($winVersion.VersionString) - OS $($OSBitness)bits - Processor $($processorBits)bits"
Write-Verbose "PSModulePath is $($env:PSModulePath)"
Write-Verbose "systemDrive is $($systemDrive)"
Write-Verbose "mainDir is $($mainDir)"
######### UNSNIP ###########

# Install nodejs and python via chocolatey
############
$chocolatey = "$env:ChocolateyInstall\bin\choco.exe" -f $env:SystemDrive
$nodePath = "C:\Program Files (x86)\nodejs"
$nodeVersion = "6.9.1"
Invoke-Command $chocolatey "install nodejs.install --version $($nodeVersion) --forcex86 -y"
Add-Path $nodePath $true
refreshenv

Invoke-Command "$($nodePath)\npm.cmd" "install node-gyp@3.4.0" "$($nodePath)\node_modules\npm"

$python2Path = "C:\tools\python2"
Invoke-Command $chocolatey "install python2 -y"
Add-Path $python2Path $true
refreshenv

# Run npm install
# ############
$npm = "npm" -f $env:SystemDrive
Invoke-Command "$npm" "config set msvs_version 2015 --global"

refreshenv

Invoke-Command "$($nodePath)\npm.cmd" "install" $mainDir
# refreshenv

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
try {
    Write-OutPut "Running windows script: $($windowsProvisioningDir)\Installer.ps1"
    Invoke-Expression "$($windowsProvisioningDir)\Installer.ps1"
} catch {
    Write-OutPut "Installer.ps1 FAILED"
    exit 1
}
