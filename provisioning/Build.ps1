<#
  This script installs the dependencies for gpii-app:
  1) installs nodejs via chocolatey
  2) installs the gpii-app npm dependencies
  3) runs the provisioning scripts from the (gpii-)windows repo
#>

# Get root path of repo (mainDir is the parent of the scriptDir)
############
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mainDir = (get-item $scriptDir ).parent.FullName

# Install nodejs via chocolatey
############
$chocolatey = "$env:ChocolateyInstall\bin\choco.exe" -f $env:SystemDrive
$nodeVersion = "6.9.1"
iex "$chocolatey install nodejs.install --version $($nodeVersion) --forcex86 -y"
refreshenv

# Run npm install
############
$npm = "npm" -f $env:SystemDrive
iex "$npm config set msvs_version 2015 --global"
iex "$npm install $mainDir"

# Run all the windows provisioning scripts
############
$windowsProvisioningDir = Join-Path $mainDir "node_modules\gpii-windows\provisioning"
iex -Command "$($windowsProvisioningDir)\Chocolatey.ps1"
iex -Command "$($windowsProvisioningDir)\Npm.ps1"
iex -Command "$($windowsProvisioningDir)\Build.ps1"
iex -Command "$($windowsProvisioningDir)\Installer.ps1"

exit 0
