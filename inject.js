const script = document.createElement('script')
script.src = chrome.extension.getURL('main.js')
script.onload = function () {
  this.remove()
}
;(document.head || document.documentElement).appendChild(script)
