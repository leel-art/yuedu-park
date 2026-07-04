// pages/spot/spot.js —— 景点讲解页
const { getSpotById } = require('../../utils/util')

Page({
  data: {
    spot: null,
    spotId: '',
    // 加载状态
    loading: true,
    // 语音播放状态
    isAudioPlaying: false,
    audioProgress: 0,
    audioCurrent: 0,
    // 音频上下文
    audioCtx: null,
    audioTimer: null,
    // 当前视频是否已观看
    videoWatched: false,
    // 留言相关
    messages: [],
    msgNickname: '',
    msgContent: '',
    msgRating: 5
  },

  async onLoad(options) {
    const spotId = options.spotId || ''
    this.setData({ spotId })

    if (!spotId) {
      wx.showToast({ title: '景点不存在', icon: 'none' })
      wx.navigateBack()
      return
    }

    // 从云端加载景点数据
    await this.loadSpot(spotId)
  },

  // 从云端加载景点详情
  async loadSpot(spotId) {
    this.setData({ loading: true })
    try {
      const spot = await getSpotById(spotId)
      if (!spot) {
        wx.showToast({ title: '景点数据未找到', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      // 设置导航栏标题
      wx.setNavigationBarTitle({ title: spot.name })

      this.setData({ spot, spotId, loading: false })

      // 加载留言
      this.loadMessages()

      // 创建音频实例（如果有音频地址）
      if (spot.audioUrl) {
        const audioCtx = wx.createInnerAudioContext()
        audioCtx.src = spot.audioUrl
        audioCtx.onEnded(() => this.stopAudio())
        audioCtx.onError((err) => {
          console.error('音频播放失败:', err)
          wx.showToast({ title: '音频加载失败，请稍后重试', icon: 'none' })
          this.stopAudio()
        })
        this.setData({ audioCtx })
      }
    } catch (err) {
      console.error('[详情页] 数据加载失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  onUnload() {
    // 页面卸载时停止音频
    this.stopAudio()
    if (this.data.audioCtx) {
      this.data.audioCtx.destroy()
    }
  },

  // ===== 视频播放事件 =====
  onVideoPlay() {
    console.log('视频开始播放:', this.data.spotId)
    this.setData({ videoWatched: true })
  },

  onVideoEnded() {
    console.log('视频播放完毕:', this.data.spotId)
  },

  // ===== 语音讲解 =====
  toggleAudio() {
    if (this.data.isAudioPlaying) {
      this.stopAudio()
    } else {
      this.playAudio()
    }
  },

  playAudio() {
    const { audioCtx, spot, audioCurrent } = this.data
    if (!audioCtx || !spot) return

    // 从上次暂停位置继续播放
    if (audioCurrent > 0) {
      audioCtx.seek(audioCurrent * 60)
    }
    audioCtx.play()

    this.setData({ isAudioPlaying: true })

    // 模拟进度更新
    const durationMinutes = spot.duration || 10
    const timer = setInterval(() => {
      const current = this.data.audioCurrent + 0.02
      if (current >= durationMinutes) {
        this.stopAudio()
        return
      }
      this.setData({
        audioCurrent: Math.round(current * 100) / 100,
        audioProgress: Math.round((current / durationMinutes) * 100)
      })
    }, 200)
    this.setData({ audioTimer: timer })
  },

  stopAudio() {
    const { audioCtx, audioTimer } = this.data
    if (audioCtx) audioCtx.pause()
    if (audioTimer) clearInterval(audioTimer)
    this.setData({
      isAudioPlaying: false,
      audioProgress: 0,
      audioCurrent: 0,
      audioTimer: null
    })
  },

  // ===== 留言功能 =====
  onNicknameInput(e) { this.setData({ msgNickname: e.detail.value }) },
  onMsgInput(e) { this.setData({ msgContent: e.detail.value }) },
  onRateTap(e) { this.setData({ msgRating: parseInt(e.currentTarget.dataset.v) }) },

  async loadMessages() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMessages',
        data: { spotId: this.data.spotId, page: 1, pageSize: 20 }
      })
      if (res.result && res.result.success) {
        this.setData({ messages: res.result.data })
        return
      }
    } catch (err) {
      console.warn('[留言] 加载失败:', err.message)
    }
    // 降级：本地存储
    const msgs = wx.getStorageSync('yuedu_messages') || []
    const filtered = msgs.filter(m => m.spotId === this.data.spotId)
    this.setData({ messages: filtered })
  },

  async submitMessage() {
    const { msgContent, msgNickname, msgRating, spotId, spot } = this.data
    if (!msgContent.trim()) { wx.showToast({ title: '请输入留言内容', icon: 'none' }); return }
    if (msgContent.trim().length > 500) { wx.showToast({ title: '留言不能超过500字', icon: 'none' }); return }

    const nickname = msgNickname.trim() || '游客'
    try {
      const res = await wx.cloud.callFunction({
        name: 'addMessage',
        data: { spotId, spotName: spot?.name || '', nickname, content: msgContent.trim(), rating: msgRating }
      })
      if (res.result && res.result.success) {
        wx.showToast({ title: '留言成功！', icon: 'success' })
        this.setData({ msgContent: '', msgNickname: '', msgRating: 5 })
        this.loadMessages()
        return
      }
    } catch (err) {
      console.warn('[留言] 提交失败，降级本地:', err.message)
    }
    // 降级：本地存储
    const msgs = wx.getStorageSync('yuedu_messages') || []
    msgs.unshift({
      _id: Date.now().toString(), spotId, nickname,
      content: msgContent.trim(), rating: msgRating,
      createdAt: new Date().toLocaleString('zh-CN')
    })
    wx.setStorageSync('yuedu_messages', msgs.slice(0, 100))
    wx.showToast({ title: '留言成功！（本地保存）', icon: 'success' })
    this.setData({ msgContent: '', msgNickname: '', msgRating: 5 })
    this.loadMessages()
  },

  // ===== 跳转到全屏视频页 =====
  goToVideo() {
    wx.navigateTo({
      url: `/pages/video/video?spotId=${this.data.spotId}&autoPlay=1`
    })
  },

  // ===== 打开地图导航 =====
  openLocation() {
    const loc = this.data.spot.location
    if (!loc) return
    wx.openLocation({
      latitude: loc.lat,
      longitude: loc.lng,
      name: this.data.spot.name,
      address: loc.address,
      scale: 16
    })
  },

  // ===== 返回首页 =====
  returnHome() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: () => wx.navigateBack()
    })
  },

  // ===== 分享 =====
  onShareAppMessage() {
    const spot = this.data.spot
    return {
      title: `岳渎公园 · ${spot ? spot.name : '景点讲解'}`,
      path: `/pages/spot/spot?spotId=${this.data.spotId}`,
      imageUrl: spot ? spot.coverImage : ''
    }
  }
})
