var myCoin = {
    "name": "Ravencoin",
    "symbol": "RVN",
    "algorithm": "kawpow",
     "peerMagic": "5241564e",
     "peerMagicTestnet": "52564e54"
};

var Stratum = require('kawpow_personal_stratum_server');

var pool = Stratum.createPool({

    "coin": myCoin,

//    "auxes": [],

    "address": "mufpGCucKyxh1ahcaCAqp6URzhdTnoJaas", //Address to where block rewards are given

    /* Block rewards go to the configured pool wallet address to later be paid out to miners,
       except for a percentage that can go to, for examples, pool operator(s) as pool fees or
       or to donations address. Addresses or hashed public keys can be used. Here is an example
       of rewards going to the main pool op, a pool co-owner, and NOMP donation. */
    "rewardRecipients": {
    //    "n37vuNFkXfk15uFnGoVyHZ6PYQxppD3QqK": 1.5, //1.5% goes to pool op
    //    "mirj3LtZxbSTharhtXvotqtJXUY7ki5qfx": 0.5, //0.5% goes to a pool co-owner

        /* 0.1% donation to NOMP. This pubkey can accept any type of coin, please leave this in
           your config to help support NOMP development. */
    //    "22851477d63a085dbc2398c8430af1c09e7343f6": 0.1
         "mfduwzidNhyRNanyDopjAtAuKQSGLW6rYb": 1.5    
    },

    "blockRefreshInterval": 1000, //How often to poll RPC daemons for new blocks, in milliseconds

    /* This should usually be set "true". If set "false" then  getblocktemplate will not be
       automatically called after a block solution is accepted by the chain. Unless the
       "blockRefreshInterval" is set very small, this will starve the miner of new blocks
       and force it to keep resubmitting new shares for the old block. This is wasteful, but
       can be useful for mining a testnet with a powerful miner without raising the difficulty. */
    "getNewBlockAfterFound": true, 

    /* Some miner apps will consider the pool dead/offline if it doesn't receive anything new jobs
       for around a minute, so every time we broadcast jobs, set a timeout to rebroadcast
       in this many seconds unless we find a new job. Set to zero or remove to disable this. */
    "jobRebroadcastTimeout": 55,

    /* Some attackers will create thousands of workers that use up all available socket connections,
       usually the workers are zombies and don't submit shares after connecting. This features
       detects those and disconnects them. */
    "connectionTimeout": 1200, //Remove workers that haven't been in contact for this many seconds

    /* Sometimes you want the block hashes even for shares that aren't block candidates. */
    "emitInvalidBlockHashes": false,

    /* Enable for client IP addresses to be detected when using a load balancer with TCP proxy
       protocol enabled, such as HAProxy with 'send-proxy' param:
       http://haproxy.1wt.eu/download/1.5/doc/configuration.txt */
    "tcpProxyProtocol": false,

    /* If a worker is submitting a high threshold of invalid shares we can temporarily ban their IP
       to reduce system/network load. Also useful to fight against flooding attacks. If running
       behind something like HAProxy be sure to enable 'tcpProxyProtocol', otherwise you'll end up
       banning your own IP address (and therefore all workers). */
    "banning": {
        "enabled": true,
        "time": 600, //How many seconds to ban worker for
        "invalidPercent": 50, //What percent of invalid shares triggers ban
        "checkThreshold": 500, //Check invalid percent when this many shares have been submitted
        "purgeInterval": 300 //Every this many seconds clear out the list of old bans
    },

    /* Each pool can have as many ports for your miners to connect to as you wish. Each port can
       be configured to use its own pool difficulty and variable difficulty settings. varDiff is
       optional and will only be used for the ports you configure it for. */
    "ports": {
        "3333": { //A port for your miners to connect to
            "diff": 0.1, //the pool difficulty for this port

            /* Variable difficulty is a feature that will automatically adjust difficulty for
               individual miners based on their hashrate in order to lower networking overhead */
            "varDiff": {
                "minDiff": 0.0001, //Minimum difficulty
                "maxDiff": 512, //Network difficulty will be used if it is lower than this
                "targetTime": 15, //Try to get 1 share per this many seconds
                "retargetTime": 90, //Check to see if we should retarget every this many seconds
                "variancePercent": 30 //Allow time to very this % from target without retargeting
            }
       // },
       //  "3256": { //Another port for your miners to connect to, this port does not use varDiff
       //     "diff": 256 //The pool difficulty
        }
    },

    /* Recommended to have at least two daemon instances running in case one drops out-of-sync
       or offline. For redundancy, all instances will be polled for block/transaction updates
       and be used for submitting blocks. Creating a backup daemon involves spawning a daemon
       using the "-datadir=/backup" argument which creates a new daemon instance with it's own
       RPC config. For more info on this see:
          - https://en.bitcoin.it/wiki/Data_directory
          - https://en.bitcoin.it/wiki/Running_bitcoind */
    "daemons": [
        {   //Main daemon instance
            "host": "127.0.0.1",
            "port": 18766,
            "user": "my-user-if",
            "password": "my-pw"
        // },
        // {   //Backup daemon instance
        //     "host": "127.0.0.1",
        //     "port": 19344,
        //     "user": "litecoinrpc",
        //     "password": "testnet"
         }
    ],

    /* This allows the pool to connect to the daemon as a node peer to receive block updates.
       It may be the most efficient way to get block updates (faster than polling, less
       intensive than blocknotify script). It requires the additional field "peerMagic" in
       the coin config. */
    "p2p": {
        "enabled": false,

        /* Host for daemon */
        "host": "127.0.0.1",

        /* Port configured for daemon (this is the actual peer port not RPC port) mainnet:8767, tesnet:18770 */
        "port": 18770,

        /* If your coin daemon is new enough (i.e. not a shitcoin) then it will support a p2p
           feature that prevents the daemon from spamming our peer node with unnecessary
           transaction data. Assume its supported but if you have problems try disabling it. */
        "disableTransactions": true

    }

}, function(ip, port , workerName, password, extraNonce1, version, callback){ //stratum authorization function
//    console.log("Authorize " + workerName + ":" + password + "@" + ip);
    console.log("Authorize " + workerName + ":" + password + "@" + ip + " extraNonce1:" + extraNonce1 + " version" + version);    
    callback({
        error: null,
        authorized: true,
        disconnect: false
    });
});

pool.on('share', function(isValidShare, isValidBlock, data){

    if (isValidBlock)
        console.log('Block found');
    else if (isValidShare)
        console.log('Valid share submitted');
    else if (data.blockHash)
        console.log('We thought a block was found but it was rejected by the daemon');
    else
        console.log('Invalid share submitted')

    console.log('share data: ' + JSON.stringify(data));
});

/*
'severity': can be 'debug', 'warning', 'error'
'logKey':   can be 'system' or 'client' indicating if the error
            was caused by our system or a stratum client
*/
pool.on('log', function(severity, logKey, logText){
    console.log(severity + ': ' + '[' + logKey + '] ' + logText);
});

console.log("Starting Pool");
pool.start();
console.log("Pool started", pool);
// setTimeout(() => { console.log('Waiting 10 seconds'); }, 10000);
/*
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
console.log('Sleeping 10 seconds'); sleep(10000);
*/
