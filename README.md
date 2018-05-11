# GPII Application Wrapper

gpii-app is an Electron-based application wrapper for the GPII autopersonalization system.

It currently only supports Windows.


## Using a Windows VM

It is possible to provision a Windows VM for development and testing purposes. Please ensure you have met [these VM requirements](https://github.com/GPII/qi-development-environments/#requirements) before proceeding.

### Creating and removing the VM


After that you can use the `vagrant up` command to create an instance of a [Windows 10 Evaluation VM](https://github.com/idi-ops/packer-windows) which will boot an instance of the Windows 10 VM, pull in the GPII Framework's npm dependencies, and then build it. Once it has finished building, either restart the VM, or open a Command Line or PowerShell and type the following command inside the VM: `refreshenv`

If this is your first time creating this VM an 8 GB download will take place. The downloaded image will be valid for 90 days after which the Windows installation will no longer be useable. To remove an expired image you can use the ``vagrant box remove "inclusivedesign/windows10-eval"`` command.


### Running the application

Now you can open a command prompt window and use the following commands to run the GPII app:

```
cd c:\vagrant\
npm start
```

Alternatively, running the application in development mode will give you a list of snapsets in the task tray menu:
```
npm run dev
```

### Running the Tests in a VM

Ensure that your virtual box is up and running, then open a terminal (in the VM), go to the folder with gpii-app and run the test script:

```
cd v:\
npm test
```

### Generating a Coverage Report

To generate a code coverage report in a VM, open a terminal (in the VM), go to the folder with gpii-app and run the test script:

```
cd v:\
npm run coverage
```
