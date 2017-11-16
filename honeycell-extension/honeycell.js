(function(ext) {

    var connected = false;
    var device = null; // change to honeycell
    var rawData = null;

    ext._shutdown = function() {
        console.log('Extension Shutdowned');
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
        if(device != dev) return;
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    var comport = [];
    ext._deviceConnected = function(dev) {
        comport.push(dev);
        if (!device) tryNextDevice();
    };

    var poller = null;
    var watchdog = null;
    function tryNextDevice() {  
        device = comport.shift();
        if(!device) return;

        device.open({ stopBits: 0, bitRate: 57600, ctsFlowControl: 0 });
        console.log('Attempting connection with ' + device.id);
        device.set_receive_handler(function(data) {
            rawData = new Uint8Array(data);
            console.log(rawData);
            if (watchdog) {
                clearTimeout(watchdog);
                watchdog = null;
            }
        });

        poller = setInterval(function() {
            //device.send("something in");
        }, 50);

        watchdog = setTimeout(function() {
            clearInterval(poller);
            poller = null;
            device.set_receive_handler(null);
            device.close();
            device = null;
            tryNextDevice();
        }, 5000);
    }

    ext._shutdown = function() {
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