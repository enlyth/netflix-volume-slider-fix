;(() => {
  const findVolumeController = () => {
    const element = document.querySelector(
      'div.PlayerControls--button-control-row'
    )
    for (const key in element) {
      if (key.startsWith('__react')) {
        const e = element[key]
        if (e._renderedChildren && e._renderedChildren['.$volume']) {
          return e._renderedChildren['.$volume']._instance
        }
      }
    }
    return null
  }

  const findVideoContainer = () => {
    const element = document.querySelector('div.VideoContainer')
    for (const key in element) {
      if (key.startsWith('__react')) {
        const e = element[key]
        if (e._currentElement && e._currentElement._owner) {
          return e._currentElement._owner._instance
        }
      }
    }
    return null
  }

  const DOMObserver = new MutationObserver(mutations => {
    window.location.href.indexOf('/watch/') !== -1 &&
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          const VideoContainer = findVideoContainer()
          const VolumeController = findVolumeController()
          if (VideoContainer && VolumeController) {
            patchVolume(VideoContainer, VolumeController)
          }
        }
      })
  })
  const observerConfig = {
    attributes: false,
    childList: true,
    subtree: true
  }

  DOMObserver.observe(document.body, observerConfig)

  const patchVolume = (VideoContainer, VolumeController) => {
    if (VideoContainer.__patched === true) {
      return
    }
    /**
     * volume = a * e^(b * sliderPos); volume, sliderPos ∈ <0, 1>
     * See https://www.dr-lex.be/info-stuff/volumecontrols.html for more information
     */
    const a = 3.1623e-3
    const b = 5.757

    VolumeController.setVolume = function (vol) {
      const adjustedVol = a * Math.exp(b * vol)
      const player = this.props.player

      if (vol < 0.001) {
        player.setMuted(true)
        player.setVolume(this.oldVolume ? this.oldVolume : 0)
      } else {
        player.setMuted(false)
        player.setVolume(adjustedVol > 1 ? 1 : adjustedVol)
        this.setState({
          localVolume: vol
        })
      }
    }

    // On initial load, before patching the VideoContainer.getVolume function, update the slider first
    VolumeController.setVolume(VideoContainer.getVolume())

    VideoContainer.getVolume = function () {
      if (!this.player) {
        return 0
      }
      const currentVolume = this.player.getVolume()
      const fakeVol = Math.log(currentVolume / a) / b
      return fakeVol > 1 ? 1 : fakeVol
    }

    Object.defineProperty(VideoContainer, '__patched', {
      value: true
    })
  }
})()
