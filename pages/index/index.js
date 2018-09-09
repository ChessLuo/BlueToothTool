// pages/index/index.js
var app = getApp();

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}
// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  //ArrayBuffer.prototype:通过 ArrayBuffer 的原型对象可以为所有 ArrayBuffer 对象添加属性
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('')
}


Page({
  /**
   * 页面的初始数据
   */
  data: {
    textLog:"",
    isopen:false,//蓝牙适配器是否已打开
    devices: [],
    connected: false,
    chs: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    console.log("用户信息", app.globalData.userInfo);

    var log = "获取微信版本号:" + app.getWxVersion() + "\n"
      + "获取客户端平台:" + app.getPlatform() +"\n";
    that.setData({
      textLog: log
    });
    //获取当前设备平台以及微信版本
    if (app.getPlatform() == 'android' && this.versionCompare('6.5.7', app.getWxVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            that.backPage();
          } 
        }
      })
      
    } else if (app.getPlatform() == 'ios' && this.versionCompare('6.5.6', app.getWxVersion())){
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            that.backPage();
          }
        }
      })
    }

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  
  //退出页面
  backPage: function(){
    // wx.navigateBack({
    //   delta: -1
    // })
  },
  //微信版本比较
  versionCompare: function (ver1, ver2) {
    var version1pre = parseFloat(ver1)
    var version2pre = parseFloat(ver2)
    var version1next = parseInt(ver1.replace(version1pre + ".", ""))
    var version2next = parseInt(ver2.replace(version2pre + ".", ""))
    if (version1pre > version2pre)
      return true
    else if (version1pre < version2pre)
      return false
    else {
      if (version1next > version2next)
        return true
      else
        return false
    }
  },
  //清空log日志
  startClear: function () {
    var that = this;
    that.setData({
      textLog: ""
    });
  },

  /**
   * 流程：
   * 1.先初始化蓝牙适配器，
   * 2.获取本机蓝牙适配器的状态，
   * 3.开始搜索，当停止搜索以后在开始搜索，就会触发蓝牙是配置状态变化的事件，
   * 4.搜索完成以后获取所有已经发现的蓝牙设备，就可以将devices中的设备Array取出来，
   * 5.然后就可以得到所有已经连接的设备了
   */
  startScan:function(){
    var that = this;
    that._discoveryStarted = false;
    if (that.data.isopen) {//如果已初始化小程序蓝牙模块，则直接执行扫描
      that.getBluetoothAdapterState();
    }else{
      that.openBluetoothAdapter(); 
    }
  },
  //初始化小程序蓝牙模块
  openBluetoothAdapter:function(){
    var that = this;
    wx.openBluetoothAdapter({
      success: function (res){
        var log = that.data.textLog + "打开蓝牙适配器成功！\n";
        that.setData({
          textLog: log,
          isopen:true
        });
        that.getBluetoothAdapterState();
      },
      fail: function (err){
        isopen: true;
        app.toastTap("蓝牙开关未开启");
        var log = that.data.textLog + "蓝牙开关未开启 \n";
        that.setData({
          textLog: log
        });   
      }  
    })
    //监听蓝牙适配器状态变化事件
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log('onBluetoothAdapterStateChange', res)
      var isDvailable = res.available;//蓝牙适配器是否可用
      if (isDvailable) {
        that.getBluetoothAdapterState();  
      } else {
        that.stopBluetoothDevicesDiscovery();//停止搜索
        that.setData({
          devices: []
        });
        app.toastTap1("蓝牙开关未开启");
      }
    })
  },
  //关闭蓝牙模块，使其进入未初始化状态。
  closeBluetoothAdapter: function () {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
  //获取本机蓝牙适配器状态
  getBluetoothAdapterState: function () {
    var that = this;
    wx.getBluetoothAdapterState({
      success: function (res) {
        var isDiscov = res.discovering;//是否正在搜索设备
        var isDvailable = res.available;//蓝牙适配器是否可用
        if (isDvailable) {
          var log = that.data.textLog + "本机蓝牙适配器状态：可用 \n";
          that.setData({
            textLog: log
          });
          if (!isDiscov){
            that.startBluetoothDevicesDiscovery();
          }else{
            var log = that.data.textLog + "已在搜索设备 \n";
            that.setData({
              textLog: log
            });
          }
        }
      }
    })
  },
  //开始扫描附近的蓝牙外围设备。
  //注意，该操作比较耗费系统资源，请在搜索并连接到设备后调用 stop 方法停止搜索。
  startBluetoothDevicesDiscovery:function(){
    var that = this;
    if (that._discoveryStarted) {
      return
    }
    that._discoveryStarted = true;
    app.showLoading("正在扫描..");
    var log = that.data.textLog + "正在扫描..\n";
    that.setData({
      textLog: log
    });
    setTimeout(function(){
      wx.hideLoading();//隐藏loading
    },2000);
    wx.startBluetoothDevicesDiscovery({
      services: [],// 以微信硬件平台的蓝牙智能灯为例，主服务的 UUID 是 FEE7。传入这个参数：services: ['FEE7']，只搜索主服务 UUID 为 FEE7 的设备
      allowDuplicatesKey: true,  //是否允许重复上报同一设备, 如果允许重复上报，则onDeviceFound 方法会多次上报同一设备，但是 RSSI(信号) 值会有不同
      success: function (res) {
        var log = that.data.textLog + "扫描附近的蓝牙外围设备成功，准备监听寻找新设备:" + res+"\n";
        that.setData({
          textLog: log
        });
        that.onBluetoothDeviceFound();  //监听寻找到新设备的事件
      }
    });

  },


  //停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。
  stopBluetoothDevicesDiscovery:function() {
    var that = this;
    var log = that.data.textLog + "停止搜寻附近的蓝牙外围设备 \n";
    that.setData({
      textLog: log
    });
    wx.stopBluetoothDevicesDiscovery()
  },
  //监听寻找到新设备的事件
  onBluetoothDeviceFound:function() {
    var that = this;
    wx.onBluetoothDeviceFound(function(res) {
      res.devices.forEach(function (device) {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = that.data.devices;       
        const idx = inArray(foundDevices, 'deviceId', device.deviceId);       
        const data = {};
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        that.setData(data)
      })
    })
  },
  //蓝牙配对之前需要先断开当前已配对的设备
  stopConnectDevices: function () {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        console.log('配对之前先断开已连接设备', res)
      }
    });
  },
  //连接低功耗蓝牙设备。
  createBLEConnection:function(e){
    var that = this;
    const ds = e.currentTarget.dataset;
    const devId = ds.deviceId;//设备UUID
    const name = ds.name;//设备名
    // that.stopConnectDevices();  //配对之前先断开已连接设备
    // app.showLoading("正在连接，请稍后");
    var log = that.data.textLog + "正在连接，请稍后..\n";
    that.setData({
      textLog: log
    });
    app.showLoading("连接中..");
    wx.createBLEConnection({
      deviceId:devId,
      success: function (res) {
        wx.hideLoading();//隐藏loading
        var log = that.data.textLog + "配对成功,获取服务..\n";
        that.setData({
          textLog: log,
          connected: true,
          name,
          devId,
        });
        that.getBLEDeviceServices(devId)
      },

      fail: function (err) {
        wx.hideLoading();//隐藏loading
        var log = that.data.textLog + "连接失败：" + err+"\n";
        that.setData({
          textLog: log
        });
        wx.showToast({
          title: '连接失败,请手动重试',
          icon: 'success'
        });
        that.closeBLEConnection()
      },

    });
    that.stopBluetoothDevicesDiscovery();   //停止搜索
  },
  //断开与低功耗蓝牙设备的连接
  closeBLEConnection:function() {
    wx.closeBLEConnection({
      deviceId: this.data.devId
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  //获取蓝牙设备所有 service（服务）
  getBLEDeviceServices:function(devId) {
    var that = this;
    wx.getBLEDeviceServices({
      deviceId:devId,
      success: function(res) {
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {//该服务是否为主服务
            var log = that.data.textLog + "该服务是否为主服务:" + res.services[i].isPrimary + "\n";
            that.setData({
              textLog: log
            });
            //传入设备id、蓝牙设备服务的 uuid
            // that.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            wx.navigateTo({
              url: '/pages/functionPage/functionPage?name=' + encodeURIComponent(that.data.name) + '&deviceId=' + encodeURIComponent(devId) + '&serviceId=' + encodeURIComponent(res.services[i].uuid)
            });
            return
          }
        }
      }
    })
  },

 
})