//app.js
App({
  onLaunch: function () {
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        // console.log("获取用户的当前设置",res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      },
      fail: function (res) {
        console.log("获取信息失败", res)
      }
    })

    this.globalData.sysinfo = wx.getSystemInfoSync();
  },
  
  getModel: function () { //获取手机型号
    return this.globalData.sysinfo["model"]
  },
  getWxVersion: function () { //获取微信版本号
    return this.globalData.sysinfo["version"]
  },
  getSystem: function () { //获取操作系统版本
    return this.globalData.sysinfo["system"]
  },
  getPlatform: function () { //获取客户端平台
    return this.globalData.sysinfo["platform"]
  },
  getSDKVersion: function () { //获取客户端基础库版本
    return this.globalData.sysinfo["SDKVersion"]
  },

  //toast提示
  toastTap: function (txt) {
    wx.showToast({
      title: txt
    })
  },
  toastTap1: function (txt) {
    wx.showToast({
      title: txt,
      duration: 3000
    })
  },
  //弹窗提示
  showModal: function (txt) {
    wx.showModal({
      title: '提示',
      content: txt,
      showCancel: false,
    })
  },
  //loading
  showLoading: function (txt) {
    wx.showLoading({
      title: txt,
      mask: true
    });
  },

  globalData: {
    userInfo: null,
    sysinfo: null
  }


})