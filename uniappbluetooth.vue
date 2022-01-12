<template>
  <view class="blue-tooth">
    <VolFormGridPanelDtl
      ref="bluetoothFormRef"
      class="bluetoothForm"
      :align="align"
      :options="bluetoothFromOptions"
      :labelStyle="labelStyle"
      :fields="bluetoothFromFields"
    ></VolFormGridPanelDtl>
    {{services}}
    {{characteristics}}
    <view class="connect">
      <!-- <button type="primary" @click="openPort">开启串口连接</button>
      <button type="primary" @click="closePort">关闭串口</button>-->
      <u-button class="btn" type="primary" @click="openBluetooth">检索蓝牙设备</u-button>
      <u-button class="btn" type="primary" @click="createBLEConnection">连接设备</u-button>
      <u-button class="btn" type="primary" @click="getBLEDeviceServices">获取设备服务</u-button>
      <u-button class="btn" type="primary" @click="closeBluetooth">关闭蓝牙连接</u-button>
    </view>

    <view class="weighingInfo">
      <VolFormGridPanelDtl
        class="weighForm"
        :align="align"
        :options="weighFromOptions"
        :labelStyle="labelStyle"
        :fields="bluetoothFromFields"
      ></VolFormGridPanelDtl>
    </view>
    <u-toast ref="uToast" />
  </view>
</template>

<script>
import VolFormGridPanelDtl from '@/components/VolFormGridPanelDtl.vue'; // 平板表单组件
export default {
  components: {
    VolFormGridPanelDtl
  },
  data() {
    return {
      align: 'right',
      labelStyle: {
        height: '40rpx',
        lineHeight: '40rpx',
        fontSize: '28rpx'
      },
      status: -2, //-2未连接  -1已连接  0连接成功
      deviceId: '', // 设备id
      bleDevs: [], //蓝牙列表
      serviceId: '', // 服务id
      services: [], //服务列表
      characteristicId: '', //特征id
      characteristics: [], // 特征列表
      bluetoothFromOptions: [
        [
          {
            field: 'deviceId', // 功能英文
            name: '蓝牙设备', // 功能名称
            type: 'dropList', // 参照类型
            placeholder: '', //默认显示字符
            text: 'deviceIdName',
            value: 'deviceId',
            dropOption: 'bleDevs',
            clearable: true,
            placeholder: '', //默认显示字符
            filterable: true,
            // multiple: true // 允许多选
            dropChange: (index, value, label, formItem, fields) => {
              console.log(fields.bleDevs[index]);
              let item = fields.bleDevs[index];

              // console.log(index, value, label, formItem, fields);
              fields.deviceId = item.value;
              fields.deviceIdName = item.label;
              Object.assign(this.bluetoothFromFields, item);
            }
          }
        ]
      ],
      bluetoothFromFields: {
        deviceIdName: '',
        deviceId: '',
        weighingNumber: '', // 称重数量
        bleDevs: [] //蓝牙列表
      },
      weighFromOptions: [
        // 表单显示效果
        [
          {
            field: 'weighingNumber', // 功能英文
            name: '称重数量', // 功能名称
            type: 'input', // 输入类型
            placeholder: '', //默认显示字符
            required: true,
            disabled: true // 允许不允许输入，select组件默认允许输入
          }
        ]
      ]
    };
  },
  methods: {
    // ArrayBuffer转16进度字符串
    ab2hex(buffer) {
      const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
          return ('00' + bit.toString(16)).slice(-2);
        }
      );
      return hexArr.join('');
    },
    // ArrayBuffer转字符串
    ab2str(buf) {
      return String.fromCharCode.apply(null, new Uint8Array(buf));
    },
    // 蓝牙初始化
    openBluetooth() {
      console.log('初始化蓝牙>>>');
      this.bluetoothFromFields.bleDevs.splice(0);
      uni.openBluetoothAdapter({
        success: res => {
          //已打开
          uni.getBluetoothAdapterState({
            //蓝牙的匹配状态
            success: res1 => {
              console.log(res1, '“本机设备的蓝牙已打开”');
              // 开始搜索蓝牙设备
              this.startBluetoothDeviceDiscovery();
            },
            fail(error) {
              uni.showToast({ icon: 'none', title: '查看手机蓝牙是否打开' });
            }
          });
        },
        fail: err => {
          //未打开
          uni.showToast({ icon: 'none', title: '查看手机蓝牙是否打开' });
        }
      });
    },
    // 启动蓝牙发现
    startBluetoothDeviceDiscovery() {
      uni.startBluetoothDevicesDiscovery({
        success: res => {
          console.log('启动成功', res);
          this.$refs.uToast.show({
            title: '启动成功' + res,
            type: 'success'
          });
          // 存储外围设备
          this.onBluetoothDeviceFound();
        },
        fail: err => {
          this.$refs.uToast.show({
            title: err + '错误信息',
            type: 'error'
          });
          console.log(err, '错误信息');
        }
      });
    },
    // 蓝牙发现外围设备
    onBluetoothDeviceFound() {
      console.log('发现外围设备');
      uni.onBluetoothDeviceFound(res => {
        console.log(res);
        // ["name", "deviceId"]
        // 吧搜索到的设备存储起来，方便我们在页面上展示
        if (
          this.bluetoothFromFields.bleDevs.indexOf(res.devices[0].deviceId) ==
          -1
        ) {
          let BleDev = res.devices.map(item => {
            let dev = {
              value: item.deviceId,
              label: item.deviceId + ';' + item.name
            };
            Object.assign(dev, item);
            return dev;
          });
          // this.bluetoothFromFields.bleDevs.push(res.devices[0]);
          this.bluetoothFromFields.bleDevs.push(...BleDev);
        }
        // this.$refs.bluetoothFormRef.$forceUpdate();
        console.log('蓝牙列表', this.bluetoothFromFields.bleDevs);
      });
    },
    //选择设备连接吧deviceId传进来
    createBLEConnection() {
      console.log('选择设备');
      let item = this.bluetoothFromFields;

      let thit = this;
      //data里面建立一个deviceId，存储起来
      this.deviceId = item.deviceId;
      //连接蓝牙
      uni.createBLEConnection({
        // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
        deviceId: this.deviceId,
        success: res => {
          //防止在这里面取不到this，古在外面用thit存储了this
          thit.stopBluetoothDevicesDiscovery();

          this.$refs.uToast.show({
            title: '蓝牙连接成功deviceId' + res,
            type: 'success'
          });
          console.log('蓝牙连接成功deviceId', res);
        },
        fail: res => {
          console.log('蓝牙连接失败', res);
          this.$refs.uToast.show({
            title: '蓝牙连接失败' + res,
            type: 'error'
          });
        }
      });
    },
    // 停止搜寻蓝牙设备
    stopBluetoothDevicesDiscovery() {
      uni.stopBluetoothDevicesDiscovery({
        success: e => {
          this.loading = false;
          this.$refs.uToast.show({
            title: '停止搜索蓝牙设备成功' + e.errMsg,
            type: 'success'
          });
          console.log('停止搜索蓝牙设备成功:' + e.errMsg);
        },
        fail: e => {
          console.log('停止搜索蓝牙设备失败，错误码：' + e.errCode);
          this.$refs.uToast.show({
            title: '停止搜索蓝牙设备失败，错误码：' + e.errCode,
            type: 'error'
          });
        }
      });
    },
    //获取蓝牙的所有服务
    getBLEDeviceServices() {
      console.log('获取蓝牙的所有服务');
      setTimeout(() => {
        uni.getBLEDeviceServices({
          // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
          deviceId: this.deviceId,
          success: res => {
            //这里会获取到好多个services  uuid  我们只存储我们需要用到的就行，这个uuid一般硬件厂家会给我们提供
            console.log('services', res.services);
            this.services = services;
            res.services.forEach(item => {
              if (item.uuid.indexOf('9FAFD205E455') != -1) {
                this.serviceId = item.uuid;
                // 这里获取回调，读取成功就的值就会在这个地方接收到！！！
                uni.onBLECharacteristicValueChange(res => {
                  console.log('监听成功', res.value);
                  //res.value是ArrayBuffer类型的，官方给了一个方法转16进制，我们再进行操作
                  console.log(this.ab2hex(res.value));

                  console.log(this.ab2str(res.value));
                  // const strvalue = new TextDecoder('utf-8').decode(res.value);

                  let str = this.ab2str(res.value).split('').reverse().join('');
                  this.bluetoothFromFields.weighingNumber = Number(
                    str.substring(1, str.length)
                  );
                  // console.log(strvalue);
                }),
                  //进入特征
                  this.getBLEDeviceCharacteristics();
              }
            });
          }
        });
      }, 1000);
    },
    // 进入特征
    getBLEDeviceCharacteristics() {
      console.log('进入特征');
      setTimeout(() => {
        uni.getBLEDeviceCharacteristics({
          // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
          deviceId: this.deviceId,
          // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
          serviceId: this.serviceId,
          success: res => {
            console.log('res.characteristics.', res.characteristics);
            this.characteristics = res.characteristics;
            res.characteristics.forEach(item => {
              if (item.uuid.indexOf('23C647249616') != -1) {
                console.log('characteristicId:', item.uuid);
                this.characteristicId = item.uuid;
                //利用传参的形势传给下面的notify，这里的uuid如果都需要用到，就不用做判断了，建议使用setTimeout进行间隔性的调用此方法
                this.notifyBLECharacteristicValueChange(item.uuid);
              }
            });
          },
          fail: res => {
            console.log(res);
          }
        });
      }, 1000);
    },
    // 启用 notify 功能
    notifyBLECharacteristicValueChange(characteristicId) {
      console.log('特征值', characteristicId);

      uni.notifyBLECharacteristicValueChange({
        state: true, // 启用 notify 功能
        // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
        deviceId: this.deviceId,
        // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
        serviceId: this.serviceId,
        // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
        characteristicId: this.characteristicId,
        success: res => {
          console.log('启用 notify 功能 success', res.errMsg);
        },
        fail: res => {
          console.log('启用 notify 功能 fail', res.errMsg);
        }
      });
    },
    closeBluetooth() {
      let item = this.bluetoothFromFields;
      uni.closeBLEConnection({
        deviceId: item.deviceId,
        success: res => {
          this.$refs.uToast.show({
            title: '断开蓝牙成功',
            type: 'success'
          });
          console.log('断开蓝牙成功', res);
        },
        fail: res => {
          this.$refs.uToast.show({
            title: '断开蓝牙失败',
            type: 'error'
          });
          console.log('断开蓝牙失败', res);
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
.blue-tooth {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  .connect {
    display: flex;
  }
}
</style>
