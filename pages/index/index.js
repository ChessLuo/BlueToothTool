// pages/index/index.js
var app = getApp();
var utils = require("../../utils/util.js");

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}


// 在页面中定义插屏广告
let interstitialAd = null


Page({
  /**
   * 页面的初始数据
   */
  data: {
    textLog: "",
    isopen: false, //蓝牙适配器是否已打开
    devices: [],
    connected: false,
    chs: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    console.log("用户信息", app.globalData.userInfo);

    // 在页面onLoad回调事件中创建插屏广告实例
    if (wx.createInterstitialAd) {
      interstitialAd = wx.createInterstitialAd({
        adUnitId: 'adunit-0eadc609afe6d24d'
      })
      interstitialAd.onLoad(() => { })
      interstitialAd.onError((err) => { })
      interstitialAd.onClose(() => { })
    }


    var log = "获取微信版本号:" + app.getWxVersion() + "\n" +
      "获取客户端系统:" + app.getPlatform() + "\n" +
      "系统版本:" + app.getSystem() + "\n";
    that.setData({
      textLog: log
    });
    //获取当前设备平台以及微信版本
    if (app.getPlatform() == 'android' && utils.versionCompare('6.5.7', app.getWxVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false,
        success: function(res) {
          if (res.confirm) {
            that.backPage();
          }
        }
      })

    } else if (app.getPlatform() == 'android' && utils.versionCompare('4.3.0', app.getSystem())) {
      wx.showModal({
        title: '提示',
        content: '当前系统版本过低，请更新至Android4.3以上版本',
        showCancel: false,
        success: function(res) {
          if (res.confirm) {
            that.backPage();
          }
        }
      })
    } else if (app.getPlatform() == 'ios' && utils.versionCompare('6.5.6', app.getWxVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false,
        success: function(res) {
          if (res.confirm) {
            that.backPage();
          }
        }
      })
    }

  },

  onShow:function(){
    // 在适合的场景显示插屏广告
    if (interstitialAd) {
      interstitialAd.show().catch((err) => {
        console.error(err)
      })
    }
  },

  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log("生命周期函数--监听页面卸载");
    this.closeBluetoothAdapter(); //关闭蓝牙模块，使其进入未初始化状态。
  },


  //退出页面
  backPage: function() {
    // wx.navigateBack({
    //   delta: -1
    // })
  },

  //清空log日志
  startClear: function() {
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
  startScan: function() {
    var that = this;
    that._discoveryStarted = false;
    if (that.data.isopen) { //如果已初始化小程序蓝牙模块，则直接执行扫描
      that.getBluetoothAdapterState();
    } else {
      that.openBluetoothAdapter();
    }
  },
  //初始化小程序蓝牙模块
  openBluetoothAdapter: function() {
    var that = this;
    wx.openBluetoothAdapter({
      success: function(res) {
        var log = that.data.textLog + "打开蓝牙适配器成功！\n";
        that.setData({
          textLog: log,
          isopen: true
        });
        that.getBluetoothAdapterState();
      },
      fail: function(err) {
        isopen: true;
        app.showModal1("蓝牙开关未开启");
        var log = that.data.textLog + "蓝牙开关未开启 \n";
        that.setData({
          textLog: log
        });
      }
    })
    //监听蓝牙适配器状态变化事件
    wx.onBluetoothAdapterStateChange(function(res) {
      console.log('onBluetoothAdapterStateChange', res)
      var isDvailable = res.available; //蓝牙适配器是否可用
      if (isDvailable) {
        that.getBluetoothAdapterState();
      } else {
        that.stopBluetoothDevicesDiscovery(); //停止搜索
        that.setData({
          devices: []
        });
        app.showModal1("蓝牙开关未开启");
      }
    })
  },
  //关闭蓝牙模块，使其进入未初始化状态。
  closeBluetoothAdapter: function() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
  //获取本机蓝牙适配器状态
  getBluetoothAdapterState: function() {
    var that = this;
    wx.getBluetoothAdapterState({
      success: function(res) {
        var isDiscov = res.discovering; //是否正在搜索设备
        var isDvailable = res.available; //蓝牙适配器是否可用
        if (isDvailable) {
          var log = that.data.textLog + "本机蓝牙适配器状态：可用 \n";
          that.setData({
            textLog: log
          });
          if (!isDiscov) {
            that.startBluetoothDevicesDiscovery();
          } else {
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
  startBluetoothDevicesDiscovery: function() {
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
    setTimeout(function() {
      wx.hideLoading(); //隐藏loading
    }, 3000);
    wx.startBluetoothDevicesDiscovery({
      services: [],
      allowDuplicatesKey: true, //是否允许重复上报同一设备, 如果允许重复上报，则onDeviceFound 方法会多次上报同一设备，但是 RSSI(信号) 值会有不同
      success: function(res) {
        var log = that.data.textLog + "扫描附近的蓝牙外围设备成功，准备监听寻找新设备:" + res + "\n";
        that.setData({
          textLog: log
        });
        that.onBluetoothDeviceFound(); //监听寻找到新设备的事件
      }
    });

  },


  //停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。
  stopBluetoothDevicesDiscovery: function() {
    var that = this;
    var log = that.data.textLog + "停止搜寻附近的蓝牙外围设备 \n";
    that.setData({
      textLog: log
    });
    wx.stopBluetoothDevicesDiscovery()
  },
  //监听寻找到新设备的事件
  onBluetoothDeviceFound: function() {
    var that = this;
    wx.onBluetoothDeviceFound(function(res) {
      res.devices.forEach(function(device) {
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

  //连接低功耗蓝牙设备。
  createBLEConnection: function(e) {
    var that = this;
    const ds = e.currentTarget.dataset;
    const devId = ds.deviceId; //设备UUID
    const name = ds.name; //设备名
    // that.stopConnectDevices();  //配对之前先断开已连接设备
    // app.showLoading("正在连接，请稍后");
    var log = that.data.textLog + "正在连接，请稍后..\n";
    that.setData({
      textLog: log
    });
    app.showLoading("连接中..");
    wx.createBLEConnection({
      deviceId: devId,
      success: function(res) {
        wx.hideLoading(); //隐藏loading
        var log = that.data.textLog + "配对成功,获取服务..\n";
        that.setData({
          textLog: log,
          connected: true,
          name,
          devId,
        });
        that.getBLEDeviceServices(devId)
      },

      fail: function(err) {
        wx.hideLoading(); //隐藏loading
        var log = that.data.textLog + "连接失败，错误码：" + err.errCode + "\n";
        that.setData({
          textLog: log
        });

        if (err.errCode === 10012) {
          app.showModal1("连接超时,请重试!");
        } else if (err.errCode === 10013) {
          app.showModal1("连接失败,蓝牙地址无效!");
        } else {
          app.showModal1("连接失败,请重试!"); // + err.errCode10003原因多种：蓝牙设备未开启或异常导致无法连接;蓝牙设备被占用或者上次蓝牙连接未断开导致无法连接
        }

        that.closeBLEConnection()
      },

    });
    that.stopBluetoothDevicesDiscovery(); //停止搜索
  },
  //断开与低功耗蓝牙设备的连接
  closeBLEConnection: function() {
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
  getBLEDeviceServices: function(devId) {
    var that = this;
    wx.getBLEDeviceServices({
      deviceId: devId,
      success: function(res) {
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) { //该服务是否为主服务
            var s = res.services[i].uuid;
            var log = that.data.textLog + "该服务是为主服务:" + res.services[i].uuid + "\n";
            that.setData({
              textLog: log
            });
            wx.navigateTo({
              url: '/pages/functionPage/functionPage?name=' + encodeURIComponent(that.data.name) + '&deviceId=' + encodeURIComponent(devId) + '&serviceId=' + encodeURIComponent(res.services[i].uuid)
            });
            return
          }
        }
      }
    })
  },

  //关于
  aboutClick: function() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  }


})