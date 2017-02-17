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

$installerRepo = "https://github.com/gpii/gpii-wix-installer"
$installerBranch = "HST"

# Obtaining useful tools location.
$installerDir = Join-Path $env:SystemDrive "installer" # a.k.a. C:\installer\
$npm = "npm" -f $env:SystemDrive
$git = "git" -f $env:SystemDrive
$node = Get-Command "node.exe" | Select -expandproperty Path

# If $installerDir exists delete it and clone current branch of installer.
if ((Test-Path -Path $installerDir)){
    rm $installerDir -Recurse -Force
}
Invoke-Command $git "clone --branch $($installerBranch) $($installerRepo) $($installerDir)"

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

# Copy all the relevant content of projectDir into preStaging
# TODO: Make all these robocopies a bit more sexy
Invoke-Command "robocopy" "..\node_modules $(Join-Path $preStagingDir "node_modules") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "..\configs $(Join-Path $preStagingDir "configs") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "..\src $(Join-Path $preStagingDir "src") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir LICENSE.txt" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir main.js" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir package.json" $provisioningDir -errorLevel 3
Invoke-Command "robocopy" "$projectDir $preStagingDir README.md" $provisioningDir -errorLevel 3

$packagerMetadata = "--app-copyright=`"Raising the Floor - International Association`" --win32metadata.CompanyName=`"Raising the Floor - International Association`" --win32metadata.FileDescription=`"GPII-App`" --win32metadata.OriginalFilename=`"gpii.exe`" --win32metadata.ProductName=`"GPII-App`" --win32metadata.InternalName=`"GPII-App`""

$packagerDir = Join-Path $installerDir "packager"
md $packagerDir
# TODO: Delete --prune when got fixed this issue https://github.com/electron-userland/electron-packager/issues/495
Invoke-Command $npm "prune --production" $preStagingDir
Invoke-Command "electron-packager.cmd" "$preStagingDir --platform=win32 --arch=ia32 --no-prune --overwrite --out=$packagerDir $packagerMetadata"

# Copying the packaged GPII-App content to staging/.
# TODO: Try to avoid using the electron-packager directory name hardcoding it.
$packagedAppDir = (Join-Path $packagerDir "gpii-app-win32-ia32")
Copy-Item "$packagedAppDir\*" $stagingWindowsDir -Recurse

# We are exiting with as a successful value if robocopy error is less or equal to 3
# to avoid interruption. http://ss64.com/nt/robocopy-exit.html
Invoke-Command "robocopy" "..\node_modules\gpii-windows\listeners $(Join-Path $stagingWindowsDir "listeners") /job:gpii-app.rcj *.*" $provisioningDir -errorLevel 3

# Compile listeners.
# TODO: This should be a function in Provisioning.psm1
Invoke-Environment "C:\Program Files (x86)\Microsoft Visual C++ Build Tools\vcbuildtools_msbuild.bat"
$msbuild = Get-MSBuild "4.0"
$listenersDir = Join-Path $stagingWindowsDir "listeners"
Invoke-Command $msbuild "listeners.sln /nodeReuse:false /p:Platform=Win32 /p:Configuration=Release /p:FrameworkPathOverride=`"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5.1`"" $listenersDir

md (Join-Path $installerDir "output")
md (Join-Path $installerDir "temp")

Invoke-Environment "C:\Program Files (x86)\Microsoft Visual C++ Build Tools\vcbuildtools_msbuild.bat"
$setupDir = Join-Path $installerDir "setup"
$msbuild = Get-MSBuild "4.0"
Invoke-Command $msbuild "setup.msbuild" $setupDir
