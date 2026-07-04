// components/spot-card/spot-card.js —— 景点卡片组件
Component({
  properties: {
    // 景点数据对象
    spot: {
      type: Object,
      value: {}
    }
  },

  data: {},

  methods: {
    // 点击卡片时触发（冒泡到父页面处理跳转）
    onTap() {
      this.triggerEvent('tap', { spotId: this.data.spot.id })
    }
  }
})
