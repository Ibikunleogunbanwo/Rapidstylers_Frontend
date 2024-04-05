import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoSourceLg, videoSourceSm, videoSource }) => {
  const videoRef = useRef(null);
  const videoRef2 = useRef(null);

  useEffect(() => {
    // Autoplay the video and set loop attribute
    videoRef.current.autoplay = true;
    videoRef.current.loop = true;

    videoRef2.current.autoplay = true;
    videoRef2.current.loop = true;
  }, []);

  return (
    <div className='relative'>
      <div className='absolute bg-black/60 h-full w-full'>
        {/* darken the bg of the video player */}
      </div>
      <div>
        <video ref={videoRef} muted className='w-full h-full hidden md:block'>
          <source src={videoSourceLg} type="video/mp4" />
        </video>
        <video ref={videoRef2} muted className='w-full h-full block md:hidden'>
          <source src={videoSourceSm} type="video/mp4" />
        </video>
        <video ref={videoRef2} muted className='w-full h-full '>
          <source src={videoSource} type="video/mov" />
        </video>        
      </div>
      {/* <div>
        image
      </div> */}
    </div>
  );
};

export default VideoPlayer;
