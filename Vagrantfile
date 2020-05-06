# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.require_version ">= 1.8.0"

# By default this VM will use 2 processor cores and 2GB of RAM. The 'VM_CPUS' and
# "VM_RAM" environment variables can be used to change that behaviour.
cpus = ENV["VM_CPUS"] || 2
ram = ENV["VM_RAM"] || 2048

Vagrant.configure(2) do |config|

  ["LTSC", "1909"].each do |flavour|
    config.vm.define "#{flavour}" do |latest|
      latest.vm.box = "gpii-ops/windows10-#{flavour}-eval-x64-universal"
      latest.vm.provider :virtualbox do |vm|
        vm.gui = true
        vm.linked_clone = true
        vm.customize ["modifyvm", :id, "--memory", ram]
        vm.customize ["modifyvm", :id, "--cpus", cpus]
        vm.customize ["modifyvm", :id, "--vram", "256"]
        vm.customize ["modifyvm", :id, "--accelerate3d", "off"]
        vm.customize ["modifyvm", :id, "--audio", "null", "--audiocontroller", "hda"]
        vm.customize ["modifyvm", :id, "--ioapic", "on"]
        vm.customize ["setextradata", "global", "GUI/SuppressMessages", "all"]
      end
    end
  end

  config.vm.provision "shell", path: "provisioning/Build.ps1", args: "-originalBuildScriptPath \"C:\\vagrant\\provisioning\\\""
  #config.vm.provision "shell", path: "provisioning/Installer.ps1", args: "-provisioningDir \"C:\\vagrant\\provisioning\\\""
end
