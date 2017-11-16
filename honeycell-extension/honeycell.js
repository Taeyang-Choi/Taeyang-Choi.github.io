(function(ext) {

    var connected = false;
    var device = null; // change to honeycell
    var rawData = null;

    ext._shutdown = function() {
        console.log('Extension Shutdowned');
        if(connected) connected = false;
        if(poller) poller = clearInterval(poller);
        if(device) device.close();
        device = null;
    };

    ext._getStatus = function() {
        if (!connected)
            return { status:1, msg:'Disconnected' };
        else
            return { status:2, msg:'Connected' };
    };

    ext._deviceRemoved = function(dev) {
        console.log('Device removed');
        if(connected) connected = false;
        if(device != dev) return;
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    var comport = [];
    ext._deviceConnected = function(dev) {
        comport.push(dev);
        if (!device) { 
            tryNextDevice();
            console.log("Try Connect!!");
        }
    };

    var poller = null;
    var watchdog = null;
    function tryNextDevice() {  
        device = comport.shift();
        if(!device) return;

        device.open({ stopBits: 0, bitRate: 57600, ctsFlowControl: 0 });
        console.log('Attempting connection with ' + device.id);
        console.log("initFlag:" + initFlag + " pinging: " + pinging + " pingCount:" + pingCount);
        device.set_receive_handler(function(data) {
            processInput(data);
        });

        watchdog = setTimeout(function() {
            clearInterval(poller);
            if(connected) connected = false;
            poller = null;
            device.set_receive_handler(null);
            device.close();
            device = null;
            tryNextDevice();
        }, 2500); 
    }

    var initFlag = false;
    var pinging = false;
    var pingCount = 0;
    var pinger = null;
    function processInput(data) {
        if(!initFlag) {
            connected = true;
            if (watchdog) {
                clearTimeout(watchdog);
                watchdog = null;
            }
            init();
            initFlag = true;
        } else {
            rawData = new Uint8Array(data);
            console.log(rawData);
            pinging = false;
            pingCount = 0;
        }
    }

    function init() {
        pinger = setInterval(function() {
        if (pinging) {
            if (++pingCount > 15) {
                clearInterval(pinger);
                initFlag = false;
                pinger = null;
                connected = false;
                if (device) device.close();
                device = null;
                pinging = false;
                console.log("pinger setInterval call!!");
                return;
            }
        } else {
            if (!device) {
                clearInterval(pinger);
                pinger = null;
                return;
            }
            pinging = true;
        }
        }, 100);
    }

    ext._shutdown = function() {
        if(connected) connected = false;
        if (device) device.close();
        device = null;
    };

    ext.wait_random = function(callback) {
        wait = Math.random();
        console.log('Waiting for ' + wait + ' seconds');
        window.setTimeout(function() {
            callback();
        }, wait*1000);
    };

    var descriptor = {
        blocks: [
            ['w', 'wait for random time', 'wait_random'],
        ]
    };
    
    ScratchExtensions.register('HoneyCell', descriptor, ext, {type:'serial'});
})({});