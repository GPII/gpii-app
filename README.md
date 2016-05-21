# Electron GPII

GPII Shell built with Atom Electron

After cloning this repository, run the following commands to build and run in
development:

```bash
npm install
./node_modules/.bin/electron-rebuild
# Or on Windows, this can take a while, be moderately patient
.\node_modules\.bin\electron-rebuild.cmd
npm run dedupe-infusion
npm start
```

If you are developing for multiple platforms at the same time (for instance if
you have several VMs with Windows/Linux/etc mounted to a shared folder) you
currently will need to wipe out the node_modules between OS runs as `npm install`
includes some platform specific versions when building.
