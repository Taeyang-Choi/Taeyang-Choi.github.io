(function(ext) {

    var connected = false;
    var device = null; 
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
        /*if (!device) { 
            tryNextDevice();
            console.log("Try Connect!!");
        }*/
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
            if (++pingCount > 6) {
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

    ext.inputSensor = function(module, index) {
        return "test";
    };

    ext.ledToggle = function(toggle, index) {

    };

    ext.led = function(red, green, blue, index) {

    };

    ext.ledPwm = function(red, green, blue, index) {

    };

    ext.dcMotor = function(dir, spd, index) {

    };

    ext.stop = function() {

    }

    ext.moveDirect = function(dir, spd) {

    };

    ext.move = function(l_dir, l_spd, r_dir, r_spd) {

    };

    ext.buzzer = function(hz, index) {

    };

    ext.sevenSegment = function(value, index) {

    };

    var paramString = window.location.search.replace(/^\?|\/$/g, '');
    var vars = paramString.split("&");
    var lang = 'en';
    for (var i=0; i<vars.length; i++) {
        var pair = vars[i].split('=');
    if (pair.length > 1 && pair[0]=='lang')
        lang = pair[1];
    }

    var blocks = {
        en: [
            ['r', 'Measure Sensor %m.mesures No: %m.index', 'inputSensor', 'IR', 1],
            ['r', 'Recognition Sensor %m.recognitions No: %m.index', 'inputSensor', 'PIR', 1],
            ['r', 'Position Sensor %m.positions No: %m.index', 'inputSensor', 'IMU_X', 1],
            ['r', 'Environment Sensor %m.environments No: %m.index', 'inputSensor', 'CO2', 1],
            [' ', 'LED %m.ledtoggle No: %m.index', 'ledToggle', 'ON', 1],
            [' ', '3-LED RED: %m.ledtoggle GREEN: %m.ledtoggle BLUE: %m.ledtoggle No: %m.index', 'led', 'ON', 'ON', 'ON', 1],
            [' ', '3-LED RED: %n GREEN: %n BLUE: %n No: %mindex', 'ledToggle', 0, 0, 0, 1],
            [' ', 'DC Motor move %m.dcmotor at %n speed No: %m.index', 'clockwise', 100, 1],
            [' ', 'All DC Motors stop', 'stop'],
            [' ', 'Mobile Robot move %m.directs at %n speed', 'moveDirect', 'forward', 100],
            [' ', 'Mobile Robot left wheel %m.dcmotor at %n speed right wheel %m.dcmotor at %n speed', 'clockwise', 100, 'counterclockwise', 100],
            [' ', 'Buzzer %n Hz No: %m.index', 'buzzer', 250, 1],
            [' ', '7Segment Value: %m.sevensegment No: %m.index', 1, 1]
        ],
        ko: [
            ['r', '측정센서 %m.mesures 번호: %m.index', 'inputSensor', '바닥감지', 1],
            ['r', '인식센서 %m.recognitions 번호: %m.index', 'inputSensor', '인체감지', 1],
            ['r', '관성측정센서 %m.positions 번호: %m.index', 'inputSensor', 'X', 1],
            ['r', '환경센서 %m.environments 번호: %m.index', 'inputSensor', '공기질감지', 1],
            [' ', 'LED %m.ledtoggle 번호: %m.index', 'ledToggle', '켜기', 1],
            [' ', '3색LED 빨강: %m.ledtoggle 초록: %m.ledtoggle 파랑: %m.ledtoggle 번호: %m.index', 'led', '켜기', '켜기', '켜기', 1],
            [' ', '3색LED 빨강: %n 초록: %n 파랑: %n 번호: %mindex', 'ledToggle', 0, 0, 0, 1],
            [' ', 'DC 모터 방향 %m.dcmotor 속도: %n 번호: %m.index', '시계방향', 100, 1],
            [' ', '모든 DC모터 정지하기', 'stop'],
            [' ', '모바일로봇 %m.directs 으로 움직이기 속도: %n', 'moveDirect', '앞', 100],
            [' ', '모바일로봇 왼쪽바퀴 %m.dcmotor 속도: %n 오른쪽바퀴: %m.dcmotor 속도: %n ', 'clockwise', 100, 'counterclockwise', 100],
            [' ', '부저 %n Hz 번호: %m.index', 'buzzer', 250, 1],
            [' ', '7세그먼트 값: %m.sevensegment 번호: %m.index', 1, 1]
        ]
    };

    var menus = {
        en: {
            index: [1, 2, 3, 4],
            mesures: ['IR', 'PSD', 'CDS', 'MIC', 'COLOR'],
            recognitions: ['PIR', 'TOUCH', 'HALL'],
            positions: ['IMU_X', 'IMU_Y', 'IMU_Z'],
            environments: ['CO2', 'SMOKE', 'UV', 'ALCOHOL', 'TEMP', 'HUMI'],
            ledtoggle: ['ON', 'OFF'],
            dcmotor: ['clockwise', 'counterclockwise'],
            directs: ['forward', 'backward', 'left', 'right'],
            sevensegment: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        ko: {
            index: [1, 2, 3, 4],
            mesures: ['바닥감지', '거리감지', '조도감지', '소리감지', '컬러감지'],
            recognitions: ['인체감지', '터치감지', '근접감지'],
            positions: ['X', 'Y', 'Z'],
            environments: ['공기질감지', '연기감지', '자외선감지', '알코올감지', '온도감지', '습도감지'],
            ledtoggle: ['켜기', '끄기'],
            dcmotor: ['시계방향', '반시계방향'],
            directs: ['앞', '뒤', '왼쪽', '오른쪽'],
            sevensegment: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }
    }

    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang]
    };
    
    ScratchExtensions.register('HoneyCell', descriptor, ext, {type:'serial'});
})({});