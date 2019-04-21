const VideoDisplay = require('./display/video-display.jsx');

class Video {
  static get typeName() { return 'video'; }

  getDisplayComponent() {
    return VideoDisplay;
  }
}

module.exports = Video;