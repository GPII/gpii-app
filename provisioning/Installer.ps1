<#
  This script create the Windows installer based on WiX for GPII-App.
#>

param (
    [string]$provisioningDir = (Split-Path -parent $PSCommandPath) # Default to script path.
)

# Turn verbose on, change to "SilentlyContinue" for default behaviour.
$VerbosePreference = "continue"

# Store the project folder of the script (root of the repo) as $projectDir.
$projectDir = (Get-Item $provisioningDir).parent.FullName

Import-Module (Join-Path $provisioningDir 'Provisioning.psm1') -Force

$installerRepo = "https://github.com/GPII/gpii-wix-installer"
$installerBranch = "feds-audit"

# Obtaining useful tools location.
$installerDir = Join-Path $env:SystemDrive "installer" # a.k.a. C:\installer\
$npm = "npm" -f $env:SystemDrive
$git = "git" -f $env:SystemDrive
$node = Get-Command "node.exe" | Select -expandproperty Path
$chocolatey = "$env:ChocolateyInstall\bin\choco.exe" -f $env:SystemDrive

# Installing required choco packages.
Invoke-Command $chocolatey "install wixtoolset -y"
refreshenv
# The path to WIX can be found in $env:WIX env variable but looks like chocolatey's refreshenv
# is not able to set such variable in this session. As a workaround, we ask the registry
# for such environmental variable and set it so we can use it inside this powershell session.
$wixSetupPath = Join-Path (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment' -Name WIX).WIX "bin"
Add-Path $wixSetupPath $true
refreshenv

Invoke-Command $chocolatey "install msbuild.extensionpack -y"
refreshenv

# If $installerDir exists delete it and clone current branch of installer.
if (Test-Path -Path $installerDir){
    rm $installerDir -Recurse -Force
}
Invoke-Command $git "clone --branch $($installerBranch) $($installerRepo) $($installerDir)"

# If gpii-hst-tools exists delete it and clone it again
$hstToolsDir = Join-Path (Join-Path $installerDir "staging") "gpii-hst-tools"
if (Test-Path -Path $hstToolsDir){
    rm $hstToolsDir -Recurse -Force
}
Invoke-Command $git "clone https://github.com/GPII/gpii-hst-tools $($hstToolsDir)"

# Create staging folder
$stagingWindowsDir = Join-Path (Join-Path $installerDir "staging") "windows"
if (Test-Path -Path $stagingWindowsDir) {
    rm $stagingWindowsDir -Recurse -Force
}
md $stagingWindowsDir

# Create pre-staging folder
# We need this because we don't want to run npm prune --production inside our
# working 'vagrant' folder
$preStagingDir = Join-Path $installerDir "preStaging"
if (Test-Path -Path $preStagingDir) {
    rm $preStagingDir -Recurse -Force
}
md $preStagingDir

$appDir = Join-Path $stagingWindowsDir "app"

# Install electron-packager globally.
# TODO: Define electron-packager invocation in npm scripts.
Invoke-Command $npm "install electron-packager -g" $projectDir

# Npm install the application, this needs to be done for packaging.
Invoke-Command $npm "install" $projectDir
# Currently required to generate the "mega" messages bundle
Invoke-Command $npm "run build --prefix" $projectDir

# Copy all the relevant content of projectDir into preStaging
# TODO: Make all these robocopies a bit more sexy
Invoke-Command "robocopy" "..\node_modules $(Join-Path $preStagingDir "node_modules") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "..\configs $(Join-Path $preStagingDir "configs") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "..\src $(Join-Path $preStagingDir "src") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "..\testData $(Join-Path $preStagingDir "testData") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "..\build $(Join-Path $preStagingDir "build") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir LICENSE.txt" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir main.js" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir index.js" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir package.json" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir package-lock.json" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir README.md" $provisioningDir -errorLevel 3

$packagerMetadata = "--app-copyright=`"Raising the Floor - International Association`" --win32metadata.CompanyName=`"Raising the Floor - International Association`" --win32metadata.FileDescription=`"Morphic-App`" --win32metadata.OriginalFilename=`"gpii.exe`" --win32metadata.ProductName=`"Morphic-App`" --win32metadata.InternalName=`"Morphic-App`""

$packagerDir = Join-Path $installerDir "packager"
md $packagerDir
# TODO: Delete --prune when got fixed this issue https://github.com/electron-userland/electron-packager/issues/495
# Invoke-Command $npm "prune --production" $preStagingDir
Invoke-Command "electron-packager.cmd" "$preStagingDir --platform=win32 --arch=ia32 --no-prune --overwrite --out=$packagerDir $packagerMetadata"

# Copying the packaged GPII-App content to staging/.
# TODO: Try to avoid using the electron-packager directory name hardcoding it.
$packagedAppDir = (Join-Path $packagerDir "gpii-app-win32-ia32")
Copy-Item "$packagedAppDir\*" $stagingWindowsDir -Recurse

md (Join-Path $installerDir "output")
md (Join-Path $installerDir "temp")

Invoke-Environment "C:\Program Files (x86)\Microsoft Visual C++ Build Tools\vcbuildtools_msbuild.bat"
$setupDir = Join-Path $installerDir "setup"
$msbuild = Get-MSBuild "4.0"
Invoke-Command $msbuild "setup.msbuild" $setupDir

# Copy the installer into the c:/vagrant folder
Invoke-Command "robocopy" "$(Join-Path $installerDir "output") $(Join-Path $projectDir "installer") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
