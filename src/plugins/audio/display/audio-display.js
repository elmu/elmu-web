import React from 'react';
import AudioPlayer from '../../../components/audio-player';
import ClientConfig from '../../../bootstrap/client-config';
import { inject } from '../../../components/container-context';
import { sectionDisplayProps, clientConfigProps } from '../../../ui/default-prop-types';

function AudioDisplay({ content, clientConfig }) {

  let soundUrl;
  switch (content.type) {
    case 'external':
      soundUrl = content.url || null;
      break;
    case 'internal':
      soundUrl = content.url ? `${clientConfig.cdnRootUrl}/${content.url}` : null;
      break;
    default:
      soundUrl = null;
      break;
  }

  const legendHtml = content.text || '';

  return (
    <div className="Audio">
      <AudioPlayer soundUrl={soundUrl} legendHtml={legendHtml} />
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientConfigProps
};

export default inject({
  clientConfig: ClientConfig
}, AudioDisplay);
