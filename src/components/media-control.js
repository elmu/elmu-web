import React from 'react';
import PropTypes from 'prop-types';
import { PlayButton, Timer, Progress, VolumeControl } from 'react-soundplayer/components';

function MediaControl({ durationInSeconds, playedSeconds, isPlaying, volume, onTogglePlay, onSeek, onVolumeChange }) {
  const playedPercentage = durationInSeconds ? playedSeconds / durationInSeconds * 100 : 0;
  return (
    <div className="MediaControl">
      <PlayButton className="MediaControl-playButton" playing={isPlaying} onTogglePlay={onTogglePlay} />
      <VolumeControl className="MediaControl-volumeControl" volume={volume} onVolumeChange={onVolumeChange} />
      <Progress className="MediaControl-progress" value={playedPercentage} onSeekTrack={onSeek} />
      <Timer className="MediaControl-timer" duration={durationInSeconds} currentTime={playedSeconds} />
    </div>
  );
}

MediaControl.propTypes = {
  durationInSeconds: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  onSeek: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playedSeconds: PropTypes.number.isRequired,
  volume: PropTypes.number.isRequired
};

export default MediaControl;
