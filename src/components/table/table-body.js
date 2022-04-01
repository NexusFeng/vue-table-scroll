import Vue from 'vue';
import { debounce} from 'throttle-debounce';
import LayoutObserver from './layout/observer';

export default {
  name: 'TableBody',
  mixins: [LayoutObserver],
  props: {
    store: {
      required: true
    },
  },

  render(h) {
    const tableHeader = this.store.tableHeader
    const tableData = this.tableData
    const isIndex = this.tableLayout.index
    const height = this.realBoxHeight / 2
    const pos = this.pos
    const enter = () => {
      if (this.hoverStopSwitch) this.stopMove()
    }
    const leave = () => {
      if (this.hoverStopSwitch) this.startMove()
    }
    const lineClick = (data) => {
      this.$emit('lineClick', data)
    }
    const upScroll = () => {
      if (this.yPos > 0) this.yPos = -height
      this.yPos += 20
    }
    const downScroll = () => {
      if (Math.abs(this.yPos) >= height) this.yPos = 0
      this.yPos -= 20
    }
    const wheel = (e) => {
      this.isStart && debounce(10, () => {
        e.wheelDelta > 0 ? upScroll(): downScroll()
      })()
    }
    return (
      <div ref="wrap">
        <div ref="realBox" style={pos} vOn:mousewheel={wheel} vOn:mouseenter={enter} vOn:mouseleave={leave}>
          <table
            class="el-table__body"
            cellspacing="0"
            cellpadding="0"
            style={`width:${this.tableLayout.bodyWidth}px`}
            border="0">
            <colgroup>
            {
              isIndex && <col name={ `el-table_1_column_0` }  width="50" />
            }
            {
              tableHeader.map((column,index) => !column.hidden &&<col name={ `el-table_1_column_${index+1}` }  key={index} />)
            }
            </colgroup>
            <tbody>
              {
                tableData.map((bodyColumn, bodyIndex) => {
                  return (
                    <tr onClick={() => lineClick(bodyColumn)}>
                      {  isIndex && <td class={['el-table__cell']}>
                          <div class={ ['cell'] }>{bodyIndex+1}</div>
                        </td>
                      }
                      {
                        tableHeader.map((headerColumn, headerIndex) => {
                          return (
                            !headerColumn.hidden&& <td class={['el-table__cell']}
                              on-mouseenter={($event) => this.handleCellMouseEnter($event)}
                              on-mouseleave={this.handleCellMouseLeave}
                            >
                              <div class={ ['cell', 'el-tooltip'] }>
                              {
                                bodyColumn[headerColumn.prop]
                              }
                              </div>
                            </td>
                          )
                        })
                      }
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  computed: {
    table() {
      return this.$parent;
    },
    pos () {
      return {
        transform: `translateY(${this.yPos}px)`,
        transition: `all ${this.ease} ${this.delay}ms`,
        overflow: 'hidden'
      }
    },
    defaultOption () {
      return {
        step: 0.1, //步长
        singleStep: 6,
        hoverStop: true, //是否启用鼠标hover控制
        singleHeight: 48, //单条数据高度有值hoverStop关闭
        singleWaitTime: 1000, //单步停止等待时间
        singleStepMove: true,
        autoPlay: true,
        delayTime: 2000, //刚开始延迟滚动时间
        switchDelay: 400,
        waitTime: 2000
      }
    },
    options () {
      return Object.assign({}, this.defaultOption, this.classOption)
    },
    autoPlay () {
      return this.options.autoPlay
    },
    hoverStopSwitch () {
      return this.options.hoverStop && this.autoPlay
    },
    baseFontSize () {
      return this.options.isSingleRemUnit ? parseInt(window.getComputedStyle(document.documentElement, null).fontSize) : 1
    },
    realSingleStopHeight () {
      return this.options.singleHeight * this.baseFontSize
    },
    singleStep () {
      let step = this.options.singleStep
      if (this.realSingleStopHeight % singleStep !== 0  ) {
        console.warn('当前单步长布置单条数据高度的约数,请及时调整,避免造成滚动错位*&……%&')
      }
      return step
    }
  },

  watch: {
  },

  data() {
    return {
      tooltipContent: '',
      tipStyle: "",
      tableData: this.store.tableData,
      arrowStyle: '',
      yPos: 0,
      delay: 0,
      copyHtml: '',
      cellHeight: 0,
      parentHeight: 0,
      realBoxHeight: 0, // 内容实际宽度
    };
  },
  beforeCreate() {
    this.popperVM = null 
    this.reqFrame = null // move动画的animationFrame定时器
    this.singleWaitTime = null // single 单步滚动的定时器
    this.isHover = false // mouseenter mouseleave 控制this._move()的开关
    this.isStart = false // 外部定义高度高于表格高度开始滚动
    this.ease = 'ease-in'
  },

  methods: {
    handleCellMouseEnter(event) {
      const cell = event.target;
      const cellChild = cell.querySelector('.cell');
      const range = document.createRange();
      range.setStart(cellChild, 0);
      range.setEnd(cellChild, cellChild.childNodes.length);
      const rangeWidth = range.getBoundingClientRect().width;
      if (rangeWidth > cellChild.offsetWidth) {
        if(!this.VM) this.createTooltip()
        let offsetTop = this.getOffsetTop(event)
        let {offsetLeft, arrowOffsetLeft } = this.getOffsetLeft(event,rangeWidth)
        this.VM.$el.style.display  = ''
        this.tooltipContent = cell.innerText || cell.textContent;
        this.tipStyle = `z-index: 9999;position:absolute; left: ${offsetLeft}px; top: ${event.y}px;`
        this.arrowStyle = `left: ${arrowOffsetLeft}px`
      }
    },
    createTooltip() {
      const that = this
      this.VM = new Vue({
        render(h) {
          return (
              <div x-placement="bottom" ref = 'tooltip' class='el-tooltip__popper is-dark' style={that.tipStyle}>
              {
                that.tooltipContent
              }
              <div class="popper__arrow" style={that.arrowStyle}></div>
              </div>
          )
        }
      }).$mount();
      document.getElementsByTagName('body')[0].appendChild(this.VM.$el)
    },

    getOffsetTop(event) {
      let headerOffsetTop
      const getParentNode = node => {
        if (node.$el._prevClass === 'el-table') {
          headerOffsetTop = node.$refs.tableHeader.$el.clientHeight
          return node.$el.offsetTop
        }
        return getParentNode(node.$parent)
      }
      let parentOffsetTop = getParentNode(this)
      return parentOffsetTop + event.target.offsetTop + headerOffsetTop + event.target.clientHeight
    },

    getOffsetLeft(event, rangeWidth){
      let removeWidth = parseInt((rangeWidth - event.target.clientWidth)/2)
      const getParentNode = node => {
        if (node.$el._prevClass === 'el-table') {
          return node.$el.offsetLeft
        }
        return getParentNode(node.$parent)
      }
      let parentOffsetLeft = getParentNode(this)
      let leftWidth = parentOffsetLeft + event.target.offsetLeft - removeWidth
      let offsetLeft = leftWidth < 0 ? 0 : leftWidth
      let arrowOffsetLeft = leftWidth < 0 ? event.target.offsetLeft + event.target.clientWidth/2 : rangeWidth/2
      return {offsetLeft, arrowOffsetLeft }
    },
    handleCellMouseLeave(event) {
      if(this.VM) {
        this.VM.$el.style.display  = 'none'
      }
    },

    reset () {
      this.cancle()
      this.initMove()
    },
    cancle () {
      cancelAnimationFrame(this.reqFrame || '')
    },


    move () {
     // 鼠标移入时拦截_move()
      if (this.isHover) return
      this.cancle() //进入move立即先清除动画 防止频繁touchMove导致多动画同时进行
      this.reqFrame = requestAnimationFrame(
        function () {
          const h = this.realBoxHeight / 2  
          let { waitTime, singleStepMove } = this.options
          let { step } = this
          if (Math.abs(this.yPos) >= h) {
            this.yPos = 0
          }
          this.yPos -= step
          if (this.singleWaitTime) clearTimeout(this.singleWaitTime)
            if (!!this.realSingleStopHeight) { //是否启动了单行暂停配置
              if (Math.abs(this.yPos) % this.realSingleStopHeight < step) { // 符合条件暂停waitTime
                this.singleWaitTime = setTimeout(() => {
                  this.move()
                }, waitTime)
              } else {
                this.move()
              }
            } else {
            this.move()
          }
        }.bind(this)
      )
    },

    singleMove () {
      if (this.isHover) return
      this.cancle() 
      this.reqFrame = requestAnimationFrame(
        () => {
          const h = this.realBoxHeight / 2  
          let { waitTime, singleStep } = this.options
          if (Math.abs(this.yPos) >= h) {
            this.yPos = 0
          }
          this.yPos -= singleStep
          if (this.singleWaitTime) clearTimeout(this.singleWaitTime)
          if (Math.abs(this.yPos) % this.realSingleStopHeight < singleStep) {
            this.singleWaitTime = setTimeout(() => {
              this.singleMove()
            }, waitTime)
          } else {
            this.singleMove()
          }
        }
      )
    },
    initMove () {
      this.$nextTick(() => {
        const { switchDelay, autoPlay } = this.options
        this.dataWarm(this.data)

        if (autoPlay) {
          this.ease = 'ease-in'
          this.delay = 0
        } else {
          this.ease = 'linear'
          this.delay = switchDelay
          return
        }
        // 是否可以滚动判断
        if (this.isStart) {
          let timer = setTimeout(() => {
            this.realBoxHeight = this.$refs.realBox.offsetHeight
            this.options.singleStepMove? this.singleMove() : this.move()
            clearTimeout(timer)
          }, 0);
        } else {
          this.cancle()
          this.yPos = 0
        }
      })
    },
    dataWarm (data) {
      // if (data.length > 100) {
      //   console.warn(`数据达到了${data.length}条有点多哦~,可能会造成部分老旧浏览器卡顿。`);
      // }
    },
    startMove () {
      this.isHover = false 
      this.isStart?this.options.singleStepMove?this.singleMove() :this.move():null
    },
    stopMove () {
      this.isHover = true 
      // 防止频频hover进出单步滚动,导致定时器乱掉
      if (this.singleWaitTime) clearTimeout(this.singleWaitTime)
      this.cancle()
    },
  },
  mounted(){
    const height = this.parentHeight = this.$parent.layout.height
    const cellHeight =  this.$el.offsetHeight
    if (cellHeight > height) {
      this.tableData.push(...this.tableData)
      this.isStart = true
      let timer = setTimeout(() => {
        this.initMove()
        clearTimeout(timer)
      }, this.options.delayTime)
    }
  }
  
};
