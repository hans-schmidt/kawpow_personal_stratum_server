

# KPSS - Kawpow Personal Stratum Server


KPSS is a high performance Stratum server in Node.js. One instance of this software can startup and 
manage multiple mining instances, each with their own daemon and stratum port.

KPSS is stratum server for solo mining without a pool. It sits between your mining software and the ravend 
core node server. 

Your miner (kawpowminer) talks to your GPU card on one side (using CUDA or Open-CL) and to KPSS on the 
other side (using Stratum). Meanwhile, KPSS is also talking to ravend on its other side using the core RPC
JSON commands.

** Use at your own risk ** 
This was pulled together for my development work. It surely has bugs. It is not production-ready.

KPSS is a code fork of https://github.com/RavenCommunity/kawpow-stratum-pool

Setup should be fairly easy, but you do need a functioning ravencoin core node set up and fully syncd.
I will not show how to get that portion working.

I pulled this together in order to have a way of mining Ravencoin's testnet while I did dev work, even
if no pools were available for testnet (which was often the case and left testnet unmined). I wanted
it to be an open-source solution. I also wanted to be able to throttle-back my fairly powerful GPU card
so that I could mine testnet without raising the difficulty unnecessarily high. The solution here
accomplishes all those goals.

KPSS seems to work ok with kawpowminer. Note however that it may not currenty work with many popular 
closed-source miners because it does not currently implement the "mining.extranonce.subscribe" Stratum 
command. 


## Installation Instructions

It is possible and easiest to put all the pieces on one machine. But I did this work with the following
setup.

	-A ravend full node running and fully synd on a Linux VM in the cloud. The RPC API is enabled, but
		only for local access. I assume you have ssh access.
	-A computer running the Windows OS which contains the GPU card and where the miner software will run
		I assume you've installed ssh so that you can log into your cloud Linux VMs from Windows Powershell.
	-An Ubuntu-20.04 VM in the cloud where KPSS will be setup and running. This way you can experiment and get
		everything working. If you have trouble, throw that VM away and start over. I assume you have
		ssh access.

## The Ravencoin core node VM

Make sure it is running and fully synced. The raven.conf file might look like this:
```	
	testnet=1
	server=1
	rpcuser=my-user-id
	rpcpassword=my-passw
	miningaddress=mufpGCucKyxh1ahcaCAqp6URzhdTnoJaas
	rpcallowip=127.0.0.1
```
	
	Notes:
	-the rpcallowip provides security. We will give remote access via ssh in the next step
	-the miningaddress MUST be present, because without it, the RPC command "getblocktemplate"
		does not provide all the information needed by the miner
	-make sure that you reboot the node after making changes to raven.conf so that they get read

Bring access to the ravend RPC API port to your Windows system by forwarding the port privately via ssh

	-example for testnet: 
	ssh -i path-to-my-key -L 18766:localhost:18766 my-user-id@my-ravend-ip-address
		
		
## Kawpow Personal Stratum Server


Make sure that you have the dependencies installed:

	sudo apt-get update
	sudo apt-get install curl python2.7 build-essential libssl-dev
	sudo ln -s /usr/bin/python2.7 /usr/bin/python
	
Now install the Node version manager:

	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

After running curl to install NVM, you should see in your output something like:
	=> Appending nvm source string to /home/ubuntu/.bashrc

To use NVM, you'll first need to restart your terminal or reload .bashrc:

	source /home/ubuntu/.bashrc

We want to use Node.js 8.1.4 so run:

	nvm install v8.1.4

Now let's install KPSS into your home directory

	cd ~
	mkdir stratum-server
	cd stratum-server
	git clone https://github.com/hans-schmidt/kawpow_personal_stratum_server kawpow_personal_stratum_server
	cp kawpow_personal_stratum_server/package.json package.json
	npm install
	
Hopefully that install and build all went smoothly
Now just copy the result over for Node.js:

	mv kawpow_personal_stratum_server node_modules/kawpow_personal_stratum_server
	
That should complete the installation of KPSS.

Now open the file "server.js" using your favorite test editor.
Read this file carefully and change all configuration parameters to your choices.

Before launching KPSS, we need to forward the appropriate ports for KPSS.
-The miner will run on the Windows box and needs access to the KPSS VM (on port 3333 if you 
didn't change it in "server.js")
-KPSS needs access to ravend RPC (on port 18766 for testnet).
We can accomplish both of those by running the following on the Windows box

	example for testnet: 
	ssh -i path-to-mykey -R 18766:localhost:18766 -L 3333:localhost:3333 my-user-id@my-kpss-ip-address

That's it! It should be ready to go.

For testing purposes, you might want to copy a linux raven-cli executable over to the KPSS
VM box for testing the connection to the ravend RPC API.
-From the KPSS VM, you should be able to run the following and get a good response:

	./raven-cli -rpcuser=my-user-id -rpcpassword=my-passwd -testnet getblocktemplate
	
-Note that the answer from ravend MUST end in providing "pprpcheader" and "pprpcepoch"
values. If it ends prematurely with the "default_witness_commitment" value then the
"miningaddress" parameter was not recognized by ravend and mining won't work.
	
## Mining


To run KPSS, enter the following on the KPSS VM:

	node server.js
	
Then on the Windows box, launch the miner. For example:

	./kawpowminer.exe -U -P stratum+tcp://mufpGCucKyxh1ahcaCAqp6URzhdTnoJaas.worker@127.0.0.1:3333

If you are over-mining testnet (driving up the difficulty), then you should make the following
changes in "server.js":

	"blockRefreshInterval": 60000
	"getNewBlockAfterFound": false

