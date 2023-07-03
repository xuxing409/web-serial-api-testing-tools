if ("serial" in navigator) {
  // The Web Serial API is supported.
  console.log("The Web Serial API is supported");
} else {
  console.log("The Web Serial API is not supported");
}
navigator.serial.addEventListener("connect", (e) => {
  console.log("已连接serial");
  // Connect to `e.target` or add it to a list of available ports.
});

navigator.serial.addEventListener("disconnect", (e) => {
  console.log("已断开serial");
  // Remove `e.target` from the list of available ports.
});

navigator.serial.getPorts().then((ports) => {
  console.log("端口号", ports);
  // Initialize the list of available ports with `ports` on page load.
});

let keepReading = true;
let reader;
let writer;
// all data parsed are stored in a list ordered by received time of the data frame.
let receivedframeString = "";
let port;

$("#select-serial").on("click", async () => {
  // 过滤设备与Arduino Uno USB供应商/产品id。
  const filters = [
    //过滤条件  可以使用默认
    // { usbVendorId: 0x1a86, usbProductId: 0x7523 },
    // { usbVendorId: 0x2341, usbProductId: 0x0001 }
  ];

  // // 提示用户选择Arduino Uno设备。
  port = await navigator.serial.requestPort({ filters }); //提示用户选择端口

  const Info = port.getInfo(); //获取端口信息
  $("#serial-number").val(JSON.stringify(Info));
});

$("#send").click(async () => {
  if ($("#send-text").val().length === 0) {
    alert("发送内容不能为空");
    return;
  }

  const byteCode = $("#send-text").val().replace(/\s/g, "");

  const writer = port.writable.getWriter();

  const byteCodeArray = new Uint8Array(
    byteCode.match(/.{2}/g).map((byte) => parseInt(byte, 16))
  );

  const oldMessage = $("#message").val();
  $("#message").text(oldMessage + "\r\n" + byteCode);
  await writer.write(byteCodeArray);

  writer.releaseLock(); // 释放写入
});

$("#open").click(async () => {
  console.log(port);
  // if(port.onconnect === null) {
  //   alert("端口设置已被其他程序占用")
  // }
  let opt = {
    baudRate: 115200,
    parity: "none",
    dataBits: 8,
    stopBits: 1,
    bufferSize: 506,
    flowControl: "none",
  };
  opt.baudRate = parseInt($("#baudrate").val());
  opt.parity = $("#parity").val();
  opt.dataBits = parseInt($("#dataBits").val());
  opt.stopBits = parseInt($("#stopBits").val());
  console.log(opt);
  await port.open(opt); // 打开连接

  $("#open").attr("disabled", true);
  $("#open").addClass("disabled");

  keepReading = true;
  while (port.readable && keepReading) {
    reader = port.readable.getReader();
    // set how to write to device intervally
    try {
      // 监听来自串行设备的数据
      while (true) {
        //循环监听串口数据
        const { value, done } = await reader.read();
        console.log(value, done);
        if (done) {
          reader.releaseLock();
          break;
        }
        if (value) {
          // value 是一个 Uint8Array
          // const strvalue = new TextDecoder("utf-8").decode(value);
          const strvalue = Array.from(value)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
          console.log(strvalue);
          if (strvalue.length < 10) {
            receivedframeString = receivedframeString + strvalue;
            if (receivedframeString.length === 10) {
              let old = $("#message").val();
              $("#message").text(old + "\r\n" + receivedframeString);
              receivedframeString = "";
            }
          } else {
            let old = $("#message").val();
            $("#message").text(old + "\r\n" + strvalue);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      reader.releaseLock();
    }
  }
});

$("#close").click(async () => {
  $("#open").removeAttr("disabled");
  $("#open").removeClass("disabled");
  try {
    keepReading = false;
    await reader.cancel();
    await port.close();
  } catch (e) {
    console.log(e);
    //TODO handle the exception
  }
});
$("#clearReceiver").on("click", () => {
  $("#message").text("");
});
