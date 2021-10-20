if ("serial" in navigator) {
  // The Web Serial API is supported.
  console.log("The Web Serial API is supported");
} else {
  console.log("The Web Serial API is not supported");
}
navigator.serial.addEventListener('connect', (e) => {
    console.log("已连接serial");
// Connect to `e.target` or add it to a list of available ports.
});

navigator.serial.addEventListener('disconnect', (e) => {
  console.log("已断开serial");
  // Remove `e.target` from the list of available ports.
});

navigator.serial.getPorts().then((ports) => {
  console.log("端口号",ports);
  // Initialize the list of available ports with `ports` on page load.
});

let keepReading = true;
let reader;
let writer;
// all data parsed are stored in a list ordered by received time of the data frame.
let receivedframeString = '';
let port;


  $('#select-serial').on('click', async() => {
    // 过滤设备与Arduino Uno USB供应商/产品id。
    const filters = [   //过滤条件  可以使用默认
      { usbVendorId: 0x1a86, usbProductId: 0x7523 },
      // { usbVendorId: 0x2341, usbProductId: 0x0001 }
    ];

    // // 提示用户选择Arduino Uno设备。
    // const port = await navigator.serial.requestPort({ filters });

    port = await navigator.serial.requestPort({filters});   //提示用户选择端口

    const Info = port.getInfo();  //获取端口信息
    $("#serial-number").val(JSON.stringify(Info));
  })


  $("#send").click(async () => {
      if ($("#send-text").val().length === 0) {
        alert("发送内容不能为空");
        return;
      }


      const sendText = $("#send-text").val();

      // console.log(port);
      // // const textEncoder = new TextEncoderStream();
      // // const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      // // const writer = textEncoder.writable.getWriter();
      // writer = port.writable.getWriter();

      // console.log(writer);

      // const data = new TextEncoder().encode(sendText);//new Uint8Array([104, 101, 108, 108, 111]); // hello

      // console.log(data);

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      const writer = textEncoder.writable.getWriter();

      await writer.write(sendText);

      writer.releaseLock();// 释放写入
  })

  $("#open").click(async() => {
    console.log(port);
    // if(port.onconnect === null) {
    //   alert("端口设置已被其他程序占用")
    // }
    let opt = {
      baudRate: 9600,
      parity: 'none',
      dataBits: 8,
      stopBits: 1
    };
    opt.baudRate = parseInt($("#baudrate").val())
    opt.parity = $("#parity").val()
    opt.dataBits = parseInt($("#dataBits").val())
    opt.stopBits =  parseInt($("#stopBits").val())
    console.log(opt);
    await port.open(opt); // 打开连接




    $("#open").attr("disabled",true);
    $("#open").addClass("disabled");

    keepReading = true;
    while(port.readable && keepReading) {
    reader = port.readable.getReader();

     // set how to write to device intervally
        try {
        // 监听来自串行设备的数据
          while (true) {   //循环监听串口数据
            const { value, done } = await reader.read();
            if (done) {   
              reader.releaseLock();
              break;
            }
            if (value) {
              // value 是一个 Uint8Array
              const strvalue = new TextDecoder("utf-8").decode(value);

              if(strvalue.length < 10) {
                receivedframeString =  receivedframeString + strvalue
                if(receivedframeString.length === 10) {
                  let old = $("#message").val()
                  $("#message").text(old + "\r\n" + receivedframeString)
                  receivedframeString = ""
                }
              }
              else {
                console.log(strvalue);
                let old = $("#message").val()
                $("#message").text(old + "\r\n" + strvalue)
              }
            
            }

          }
        } catch(error) {
          console.error(error);
        } finally {
          reader.releaseLock();
        }

    }

  })

  $("#close").click(async () => {
    $("#open").removeAttr('disabled');
    $("#open").removeClass('disabled');
    try {
        keepReading = false
        await reader.cancel();
        await port.close();
      } catch (e) {
        console.log(e);
        //TODO handle the exception
      }
  })
  $("#clearReceiver").on("click", () => {
    console.log(1111);
    $("#message").text("")
  })

