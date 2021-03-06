/* eslint-disable no-unused-vars */
class DanmakuManager {
  constructor (danmakuConfig) {
    this.danmakuList = []
    this.danmakuWaitList = []
    this.danmakuConfig = danmakuConfig
    this.moveTimerId = setInterval(() => {
      this.moveDanmaku()
    }, this.calcSpeed())
    this.danmakuMaxStep = 26
    this.danmakuLastStep = 0
    this.baseSpeed = 9.5

    this.stillDanmakuTimeout = 3000
  }

  updateConfig (config) {
    this.changeFontFamily(config.FontFamily)
    this.changeFontSize(config.FontSize)
    this.changeOpacity(config.Opacity)
    this.changeSpeed(this.calcSpeed(config.Speed))
  }

  bindContainer (container = null) {
    // console.log('bindContainer')
    // this.danmakuContainer = container
    if (container) this.danmakuContainer = container
    else this.danmakuContainer = document.getElementById('danmakuContainer')
  }

  pauseMove () {
    clearInterval(this.moveTimerId)
  }

  resumeMove () {
    this.moveTimerId = setInterval(this.moveDanmaku.apply(this), this.calcSpeed())
  }

  destroy () {
    clearInterval(this.moveTimerId)
    this.danmakuList.forEach((danmaku) => {
      this.danmakuContainer.removeChild(danmaku)
    })
    this.danmakuList = []
  }

  moveDanmaku () {
    this.danmakuList.forEach((danmaku) => {
      if (danmaku.position !== 0) {
        if (danmaku.timeout >= this.stillDanmakuTimeout) {
          this.animeEnd(danmaku)
        } else {
          danmaku.timeout += this.calcSpeed()
        }
        return
      }
      if (danmaku.move > danmaku.maxMove) {
        this.animeEnd(danmaku)
        return
      }
      danmaku.move++
      danmaku.style.right = danmaku.begin + 'px'
      danmaku.begin++
    })
  }

  calcSpeed () {
    return this.baseSpeed * (1 / (this.danmakuConfig.Speed / 50))
  }

  changeOpacity (opacity) {
    this.danmakuList.forEach((danmaku) => {
      danmaku.style.opacity = opacity / 10
    })
  }

  changeFontSize (fontSize) {
    this.danmakuList.forEach((danmaku) => {
      danmaku.style.fontSize = fontSize + 'px'
      danmaku.style.width = 'unset'
      danmaku.style.width = danmaku.offsetWidth + 'px'
    })
  }

  changeFontFamily (fontFamily) {
    this.danmakuList.forEach((danmaku) => {
      danmaku.style.fontFamily = fontFamily
    })
  }

  changeSpeed (newSpeed) {
    clearInterval(this.moveTimerId)
    this.moveTimerId = setInterval(() => { this.moveDanmaku.apply(this) }, newSpeed)
  }

  animeEnd (element) {
    this.danmakuContainer.removeChild(element)
    this.danmakuList.splice(this.danmakuList.indexOf(element), 1)
    console.log('animeEnd')
  }

  reCalcMaxMove () {
    this.danmakuList.forEach((danmaku) => {
      danmaku.maxMove = this.danmakuContainer.clientWidth + danmaku.width * 2
    })
  }

  createElement (text, color, position, showWrench = false, self = false, streamer = false) {
    this.bindContainer()
    const element = document.createElement('span')
    this.danmakuContainer.appendChild(element)
    element.position = position
    if (showWrench) {
      element.innerHTML = `<span><i aria-hidden="true" style="color:skyblue;" class="v-icon notranslate mdi mdi-wrench theme--dark"></i></span>${text}`
    } else if (streamer) {
      element.innerHTML = `<span><i aria-hidden="true" style="color:skyblue;" class="v-icon notranslate mdi mdi-broadcast theme--dark"></i></span>${text}`
    } else {
      element.innerText = text
    }
    element.style = `font-size: ${this.danmakuConfig.FontSize}px; opacity: ${
      this.danmakuConfig.Opacity / 10
    }; color: ${color}; font-family: ${
      this.danmakuConfig.FontFamily
    }; font-weight: ${this.danmakuConfig.Bold ? 'bold' : 'normal'}; ${self ? 'border: 1px solid rgb(54,166,242);' : ''}`
    element.style.width = element.offsetWidth + 2 + 'px'
    element.width = element.offsetWidth + 2
    element.maxMove = this.danmakuContainer.clientWidth + element.width * 2
    element.move = 0
    element.timeout = 0
    element.classList.add('danmakuBase')

    if (position === 0) {
      element.classList.add('danmakuMoveItem')
      this.scrollPositionFind(element)
    } else {
      element.classList.add('danmakuStillItem')
      this.stillPositionFind(element)
    }
    element.begin =
      this.danmakuContainer.clientWidth -
      element.offsetLeft -
      element.clientWidth
    this.danmakuList.push(element)
  }

  scrollPositionFind (element) {
    const height = element.offsetHeight
    let step = 0
    let findFlag = false
    const containerWidth = this.danmakuContainer.clientWidth
    this.danmakuMaxStep = parseInt(
      (this.danmakuContainer.offsetHeight * this.danmakuConfig.Height) /
        100 /
        height
    )
    for (let i = 0; i <= this.danmakuMaxStep; i++) {
      const len = this.danmakuList.filter(
        (x) =>
          x.step === step &&
          x.position === 0 &&
          containerWidth - x.offsetLeft - x.clientWidth < x.clientWidth
      )
      if (len.length === 0) {
        findFlag = true
        break
      } else {
        step++
      }
    }
    if (!findFlag) {
      if (this.danmakuLastStep === this.danmakuMaxStep) {
        this.danmakuLastStep = 0
      } else {
        this.danmakuLastStep++
      }

      element.step = this.danmakuLastStep
      step = element.step
      const arr = this.danmakuList.filter(
        (x) => x.step === this.danmakuLastStep
      )
      const lastElement = arr[arr.length - 1]
      if (lastElement) {
        const rightOffset = containerWidth - lastElement.offsetLeft - lastElement.clientWidth
        element.maxMove += lastElement.clientWidth + 5
        element.style.right = `${rightOffset - lastElement.clientWidth - 5}px`
      } else {
        element.style.right = `${containerWidth - 5}px`
      }
    } else {
      this.danmakuLastStep = step
    }
    element.step = step
    element.style.top = `${step * height}px`
  }

  stillPositionFind (element) {
    const height = element.offsetHeight
    let step = 0
    let findFlag = false
    const danmakuMaxStepVertical = parseInt(
      this.danmakuContainer.offsetHeight / height
    )
    for (let i = 0; i <= danmakuMaxStepVertical; i++) {
      const len = this.danmakuList.filter(
        (x) => x.step === step && x.position === element.position
      )
      if (len.length === 0) {
        findFlag = true
        break
      } else {
        step++
      }
    }
    if (!findFlag) {
      if (this.danmakuLastStep === danmakuMaxStepVertical) {
        this.danmakuLastStep = 0
      } else {
        this.danmakuLastStep++
      }

      element.step = this.danmakuLastStep
      step = element.step
    } else {
      this.danmakuLastStep = step
    }
    element.step = step
    if (element.position === 1) {
      element.style.top = `${step * height}px`
    } else {
      element.style.bottom = `${step * height}px`
    }
  }
}

export { DanmakuManager }
