(function(ext) {
    var hdLocalData = {
        sensorType: [0, 0, 0, 0],
        sensorId: [0, 0, 0, 0],
        sensorNo: [0, 0, 0, 0],
        sensorData: [0, 0, 0, 0]
    };

    var hdRemoteData = {
        DC_MOTOR:[false, null, null, null, null],
        BUZZER:[false, null, null, null, null],
        SEVEN_SEGMENT:[false, null, null, null, null],
        LED_R:[false, null, null, null, null],
        LED_G:[false, null, null, null, null],
        LED_B:[false, null, null, null, null]
    };

    var rqRemoteData = {
        IR:[null, null, null, null],
        PSD:[null, null, null, null],
        CDS:[null, null, null, null],
        MIC:[null, null, null, null],
        COLOR:[null, null, null, null],

        PIR:[null, null, null, null],
        TOUCH:[null, null, null, null],
        HALL:[null, null, null, null],

        IMU_X:[null, null, null, null],
        IMU_Y:[null, null, null, null],
        IMU_Y:[null, null, null, null],

        CO2_:[null, null, null, null],
        SMOKE:[null, null, null, null],
        UV:[null, null, null, null],
        ALCOHOL:[null, null, null, null],
        TEMP:[null, null, null, null],
        HUMI:[null, null, null, null],
    };

    var setZero = {
        set_zero: false
    };

    var receiveData = [];
    var linetracer = {
        flag: false,
        speed: null,
        threshold: [120, 120]
    };

    var HoneyCell = {
        // index table
        STX_IDX: 0,
        TYPE_IDX: 1,
        IDNO_IDX: [2, 3, 4, 5],
        DATA_IDX: [6, 7, 8, 9],
        CRC_IDX: 10, 
        ETX_IDX: 11,
        FLAG: 0, 
        STX: 0x02, 
        ETX: 0x03,
        MAX_NUMBER_OF_MODULES: 4,
        // key table
        SET_ZERO: "set_zero",
        // output_keytable
        DC_MOTOR: "dc_motor",
        MOVE: "move",
        STOP: "stop",
        LINE_TRACER: "line_tracer",
        THRESHOLD: "threshold",
        BUZZER: "buzzer",
        SEVEN_SEGMENT: "seven_segment",
        LED_R: "led_r",  
        LED_G: "led_g",  
        LED_B: "led_b"
    };

    var InputCMD = {
        0: "NULL", // 0x00
        // Measure Sensors
        1: "IR", // 0x01 바닥감지센서
        2: "PSD", // 0x02 거리감지센서
        3: "CDS", // 0x03 조도센서
        4: "MIC", // 0x04 마이크센서
        5: "COLOR", // 0x05 컬러감지센서
        // Recognition Sensors
        6: "PIR", // 0x06 인체감지센서
        7: "TOUCH", // 0x07 터치센서
        8: "HALL", // 0x08 근접센서
        // Position Sensors
        9: "IMU_X", // 0x09 관성측정센서 X좌표 값 
        10: "IMU_Y", // 0x0A 관성측정센서 Y좌표 값
        11: "IMU_Z", // 0x0B 관성측정센서 Z좌표 값
        // Environment Sensors
        33: "CO2_", // 0x21 공기질센서
        34: "SMOKE", // 0x22 연기센서
        35: "UV", // 0x23 자외선센서
        36: "ALCOHOL", // 0x24 알코올센서
        37: "TEMP", // 0x25 온도센서
        38: "HUMI" // 0x26 습도센서
    };

    var OutputCMD = {
        NULL: 0x00,
        DC_MOTOR: 0x11,
        BUZZER: 0x14,
        SEVEN_SEGMENT: 0x16, 
        LED_R: 0x17,  
        LED_G: 0x18,  
        LED_B: 0x19
    };

    lsb4BitExt = function(number){
        var value = parseInt(number);
        value = value & 0x0F;
        return value;
    };

    lsbToMsb = function(number){
        var value = parseInt(number);
        value = (value << 4) & 0xF0;
        return value;
    };

    lsbToMsb2Bit = function(number){
        var value = parseInt(number);
        value = (value << 4) & 0x30;
        return value;
    };

    msbToLsb2Bit = function(number){
        var value = parseInt(number);
        value = (value >> 4) & 0x03;
        return value;
    };

    generateCRC = function(type, idno, data){
        var value = HoneyCell.STX + HoneyCell.ETX;
        var i, result;
        
        value += type[0];
        for(i=0; i<HoneyCell.MAX_NUMBER_OF_MODULES; i++)
            value += idno[i];
        for(i=0; i<HoneyCell.MAX_NUMBER_OF_MODULES; i++)
            value += data[i];

        result = value & 0xFF;

        return result;
    };

    lineTracer = function() {
        var lValue, rValue;
        var pLeft, pRight;

        if(linetracer.speed > 127) {
            lValue = 0x7F;
            rValue = 0xFF;
        } else if((linetracer.speed <= 127) && (linetracer.speed >= 0)) {
            lValue = linetracer.speed & 0x7F;
            rValue = 0x80 | (linetracer.speed & 0x7F);
        }

        pLeft = rqRemoteData.PSD[0];
        pRight = rqRemoteData.PSD[1];

        if(pLeft > linetracer.threshold[0]) {
            if(pRight > linetracer.threshold[1]) {
                if(!(hdRemoteData.DC_MOTOR[1] == rValue && hdRemoteData.DC_MOTOR[2] == lValue)) {
                    hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                    hdRemoteData.DC_MOTOR[1] = rValue;
                    hdRemoteData.DC_MOTOR[2] = lValue;              
                }
            } else {
                if(!(hdRemoteData.DC_MOTOR[1] == rValue && hdRemoteData.DC_MOTOR[2] == 0)) {
                    hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                    hdRemoteData.DC_MOTOR[1] = rValue;
                    hdRemoteData.DC_MOTOR[2] = 0;
                }
            }
        } else {
            if(pRight > linetracer.threshold[1]) {
                if(!(hdRemoteData.DC_MOTOR[1] == 0 && hdRemoteData.DC_MOTOR[2] == lValue)) {
                    hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                    hdRemoteData.DC_MOTOR[1] = 0;
                    hdRemoteData.DC_MOTOR[2] = lValue;              
                }
            } else {
                if(!(hdRemoteData.DC_MOTOR[1] == 0 && hdRemoteData.DC_MOTOR[2] == 0)) {
                    hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                    hdRemoteData.DC_MOTOR[1] = 0;
                    hdRemoteData.DC_MOTOR[2] = 0;           
                }
            }
        }
    };

    handleLocalData = function(data) {
        data.forEach(function(element) {
            receiveData.push(element);
        }, receiveData);
        if(receiveData[HoneyCell.STX_IDX] != HoneyCell.STX) {
            for(var i=0; i<receiveData.length; i++) {
                if(receiveData[i] == HoneyCell.STX) {
                    receiveData = receiveData.splice(i, receiveData.length-i);
                    return;
                }
            }
        }
        //console.log(receiveData);
    };

    requestRemoteData = function() { // default function(handler)
        if(receiveData.length < 12) return;
        for(var i=0; i<parseInt(receiveData.length / 12); i++) {
            var _data = receiveData.splice(0, 12);
            if(_data.pop() == HoneyCell.ETX){
                var chunk, value;
                var crc_type, crc_idno, crc_data;
                var type, idno, data, crc;

                _data.shift();
                type = _data.splice(0, 1);
                idno = _data.splice(0, 4);
                data = _data.splice(0, 4);
                crc = _data.splice(0, 1);

                for(i=0; i<HoneyCell.MAX_NUMBER_OF_MODULES; i++){
                    // replacement type
                    value = (type[0] >> (6-i*2)) & 0x03;
                    hdLocalData.sensorType[i] = value;
                    // replacement idno
                    value = (idno[i] >> 4) & 0x0F;
                    hdLocalData.sensorId[i] = value;
                    value = idno[i] & 0x0F;
                    hdLocalData.sensorNo[i] = value;
                    // replacement data
                    value = data[i];
                    hdLocalData.sensorData[i] = value;  
                }
                if(crc != generateCRC(type, idno, data)) return;
                for(i=0; i<HoneyCell.MAX_NUMBER_OF_MODULES; i++){ 
                    var key = InputCMD[lsbToMsb2Bit(hdLocalData.sensorType[i]) + hdLocalData.sensorId[i]];
                    if(key != "NULL"){
                        rqRemoteData[key][hdLocalData.sensorNo[i]] = hdLocalData.sensorData[i];
                        //console.log("key: " + key + " value: " + hdLocalData.sensorData[i]);
                        //handler.write(key + hdLocalData.sensorNo[i], hdLocalData.sensorData[i]);
                    }
                }
            }
        }
    };

    handleRemoteData = function(handler) {
        if(handler.hasOwnProperty(HoneyCell.MOVE)) {
            if((hdRemoteData.DC_MOTOR[1]!=handler.lValue || hdRemoteData.DC_MOTOR[2]!=handler.rValue) && (!hdRemoteData.DC_MOTOR[HoneyCell.FLAG])) {
                hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                hdRemoteData.DC_MOTOR[1] = handler.lValue;
                hdRemoteData.DC_MOTOR[2] = handler.rValue;
            }
        } else if(handler.hasOwnProperty(HoneyCell.STOP) && (!hdRemoteData.DC_MOTOR[HoneyCell.FLAG])) {
            if(hdRemoteData.DC_MOTOR[1]!=0 || hdRemoteData.DC_MOTOR[2]!=0 || hdRemoteData.DC_MOTOR[3]!=0 || hdRemoteData.DC_MOTOR[4]!=0) {
                hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                for(var i=0; i<HoneyCell.MAX_NUMBER_OF_MODULES; i++)
                    hdRemoteData.DC_MOTOR[i+1] = 0;
                linetracer.flag = false;
            }
        }  else if(handler.hasOwnProperty(HoneyCell.LINE_TRACER) && (!hdRemoteData.DC_MOTOR[HoneyCell.FLAG])) {
            linetracer.flag = true;
            linetracer.speed = handler.speed;
        } else if(handler.hasOwnProperty(HoneyCell.DC_MOTOR)) {
            if(hdRemoteData.DC_MOTOR[handler.idx]!=handler.value && (!hdRemoteData.DC_MOTOR[HoneyCell.FLAG])) {
                hdRemoteData.DC_MOTOR[HoneyCell.FLAG] = true;
                hdRemoteData.DC_MOTOR[handler.idx] = handler.value;
            }
        } else if(handler.hasOwnProperty(HoneyCell.BUZZER)) {
            if(hdRemoteData.BUZZER[handler.idx]!=handler.value && (!hdRemoteData.BUZZER[HoneyCell.FLAG])) {
                hdRemoteData.BUZZER[HoneyCell.FLAG] = true;
                hdRemoteData.BUZZER[handler.idx] = handler.value;   
            }
        } else if(handler.hasOwnProperty(HoneyCell.SEVEN_SEGMENT)) {
            if(hdRemoteData.SEVEN_SEGMENT[handler.idx]!=handler.value && (!hdRemoteData.SEVEN_SEGMENT[HoneyCell.FLAG])) {
                hdRemoteData.SEVEN_SEGMENT[HoneyCell.FLAG] = true;
                hdRemoteData.SEVEN_SEGMENT[handler.idx] = handler.value;    
            }
        } else if(handler.hasOwnProperty(HoneyCell.THRESHOLD)) {
            linetracer.threshold[handler.idx] = handler.threshold;
        } else {
            if(handler.hasOwnProperty(HoneyCell.LED_R)) {
                if(hdRemoteData.LED_R[handler.idx]!=handler.led_r && (!hdRemoteData.LED_R[HoneyCell.FLAG])) {
                    hdRemoteData.LED_R[HoneyCell.FLAG] = true;
                    hdRemoteData.LED_R[handler.idx] = handler.led_r;
                }
            }
            if(handler.hasOwnProperty(HoneyCell.LED_G)) {
                if(hdRemoteData.LED_G[handler.idx]!=handler.led_g && (!hdRemoteData.LED_G[HoneyCell.FLAG])) {
                    hdRemoteData.LED_G[HoneyCell.FLAG] = true;
                    hdRemoteData.LED_G[handler.idx] = handler.led_g;
                }
            }
            if(handler.hasOwnProperty(HoneyCell.LED_B)) {
                if(hdRemoteData.LED_B[handler.idx]!=handler.led_b && (!hdRemoteData.LED_B[HoneyCell.FLAG])) {
                    hdRemoteData.LED_B[HoneyCell.FLAG] = true;
                    hdRemoteData.LED_B[handler.idx] = handler.led_b;
                }
            }
        }
        if(linetracer.flag) {
            lineTracer();
        }
        if(handler.hasOwnProperty(HoneyCell.SET_ZERO)) { // Always footer position in handleRemoteData function
            if(handler.flag){
                setZero.set_zero = true;
                linetracer.flag = false;
                for(var key in hdRemoteData)
                    hdRemoteData[key] = [true, 0, 0, 0, 0]; 
            }       
        }
    };

    requestLocalData = function() {     
        var rqLocalData = new Array();
        var cnt = 0, index = 0, cValue; 
        for(var key in hdRemoteData) {
            if(hdRemoteData[key][HoneyCell.FLAG]) {
                for(var i=1; i<HoneyCell.MAX_NUMBER_OF_MODULES+1; i++) {
                    if(hdRemoteData[key][i] != null)
                        cnt += 1;
                }
            }
        }
        if(cnt == 0) return;

        var buf = new Array();
        cValue = parseInt((cnt-1)/HoneyCell.MAX_NUMBER_OF_MODULES)+1;

        for(var i=0; i<cValue; i++)
            buf[i] = [HoneyCell.STX, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, HoneyCell.ETX];

        for(var key in hdRemoteData){
            if(!hdRemoteData[key][HoneyCell.FLAG])
                continue;
            for(var i=1; i<5; i++){
                if(hdRemoteData[key][i] != null){
                    var fValue = parseInt(index/HoneyCell.MAX_NUMBER_OF_MODULES),
                        rValue = index%HoneyCell.MAX_NUMBER_OF_MODULES;
                    buf[fValue][HoneyCell.TYPE_IDX] |= (msbToLsb2Bit(OutputCMD[key])<<(6-rValue*2)); 
                    buf[fValue][HoneyCell.IDNO_IDX[rValue]] = lsbToMsb(OutputCMD[key]) + lsb4BitExt(i-1);
                    buf[fValue][HoneyCell.DATA_IDX[rValue]] = hdRemoteData[key][i];
                    index += 1;
                }
            }
        }

        for(var i=0; i<cValue; i++){
            type = buf[i].slice(1, 2);
            idno = buf[i].slice(2, 6);
            data = buf[i].slice(6, 10);
            buf[i][HoneyCell.CRC_IDX] = generateCRC(type, idno, data);
        }

        if(setZero.set_zero){
            for(var key in hdRemoteData){
                hdRemoteData[key] = [false, null, null, null, null];            
            }
            lineTracer.flag = false;
            lineTracer.speed = null;
            setZero.set_zero = false;
        } else {
            for(var key in hdRemoteData)
                hdRemoteData[key][HoneyCell.FLAG] = false;
        }
     
        for(var i=0; i<cValue; i++){
            for(var idx in buf[i])
                rqLocalData.push(buf[i][idx]);
        }

        if(!(rqLocalData.length%12)) { 
            console.log(rqLocalData);
            return rqLocalData;
        }
    };

    request = function(sendQueue) {
        handleRemoteData(sendQueue);
        var rqValue = requestLocalData();
        if(rqValue) {
            var sd = new Uint8Array(rqValue);
            device.send(sd.buffer);
        }
    };



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
        //console.log("initFlag:" + initFlag + " pinging: " + pinging + " pingCount:" + pingCount);
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
            handleLocalData(rawData);
            requestRemoteData();
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
        var key = Object.keys(InputCMD).find(key => InputCMD[key] === module);
        if(key) {
            return rqRemoteData[module][index - 1]; 
        } else {
            return 0;
        }
    };

    ext.ledToggle = function(toggle, index) {
        var sq = { idx: null, led_r: null, led_g: null, led_b: null };
        sq.idx = index;

        if('ON' == toggle) { sq.led_r = 255; sq.led_g = 255; sq.led_b = 255; }
        else if('OFF' == toggle) { sq.led_r = 0; sq.led_g = 0; sq.led_b = 0; }
        request(sq);
    };

    ext.led = function(red, green, blue, index) {

    };

    ext.ledPwm = function(red, green, blue, index) {

    };

    ext.dcMotor = function(dir, spd, index) {

    };

    ext.stop = function() {
        var sq = { stop: null };
        request(sq);
    }

    ext.moveDirect = function(dir, spd) {

    };

    ext.move = function(l_dir, l_spd, r_dir, r_spd) {
        var lDir, rDir, lValue, rValue;
        var sq = { move: null, lValue: null, rValue:null }

        if(l_dir == 'clockwise') { lDir = 0; }
        else if(l_dir == 'counterclockwise') { lDir = 1; }
        if(r_dir == 'clockwise') { rDir = 0; }
        else if(r_dir == 'counterclockwise') { rDir = 1; }

        if(l_spd > 127) { lValue = ((lDir << 7) & 0x80) | 0x7F; }
        else if((l_spd <= 127) && (l_spd >= 0)) { lValue = ((lDir << 7) & 0x80) | (l_spd & 0x7F); }
        if(r_spd > 127) { rValue = ((rDir << 7) & 0x80) | 0x7F; }
        else if((r_spd <= 127) && (l_spd >= 0)) { rValue = ((rDir << 7) & 0x80) | (r_spd & 0x7F); }

        sq.lValue = lValue;
        sq.rValue = rValue;
        request(sq);
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
            [' ', 'DC Motor move %m.dcmotor at %n speed No: %m.index', 'dcMotor', 'clockwise', 100, 1],
            [' ', 'All DC Motors stop', 'stop'],
            [' ', 'Mobile Robot move %m.directs at %n speed', 'moveDirect', 'forward', 100],
            [' ', 'Mobile Robot left wheel %m.dcmotor at %n speed right wheel %m.dcmotor at %n speed', 'move', 'clockwise', 100, 'counterclockwise', 100],
            [' ', 'Buzzer %n Hz No: %m.index', 'buzzer', 250, 1],
            [' ', '7Segment Value: %m.sevensegment No: %m.index', 'sevenSegment', 1, 1]
        ],
        ko: [
            ['r', '측정센서 %m.mesures 번호: %m.index', 'inputSensor', '바닥감지', 1],
            ['r', '인식센서 %m.recognitions 번호: %m.index', 'inputSensor', '인체감지', 1],
            ['r', '관성측정센서 %m.positions 번호: %m.index', 'inputSensor', 'X', 1],
            ['r', '환경센서 %m.environments 번호: %m.index', 'inputSensor', '공기질감지', 1],
            [' ', 'LED %m.ledtoggle 번호: %m.index', 'ledToggle', '켜기', 1],
            [' ', '3색LED 빨강: %m.ledtoggle 초록: %m.ledtoggle 파랑: %m.ledtoggle 번호: %m.index', 'led', '켜기', '켜기', '켜기', 1],
            [' ', '3색LED 빨강: %n 초록: %n 파랑: %n 번호: %mindex', 'ledToggle', 0, 0, 0, 1],
            [' ', 'DC 모터 방향 %m.dcmotor 속도: %n 번호: %m.index', 'dcMotor', '시계방향', 100, 1],
            [' ', '모든 DC모터 정지하기', 'stop'],
            [' ', '모바일로봇 %m.directs 으로 움직이기 속도: %n', 'moveDirect', '앞', 100],
            [' ', '모바일로봇 왼쪽바퀴 %m.dcmotor 속도: %n 오른쪽바퀴: %m.dcmotor 속도: %n ', 'move', 'clockwise', 100, 'counterclockwise', 100],
            [' ', '부저 %n Hz 번호: %m.index', 'buzzer', 250, 1],
            [' ', '7세그먼트 값: %m.sevensegment 번호: %m.index', 'sevenSegment', 1, 1]
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