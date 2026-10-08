import { Composition } from 'remotion'

import {
  AlsoScene,
  Walkthrough,
  alsoFrames,
  type WalkthroughProps,
  totalFrames,
} from './walkthrough'

const defaultProps: WalkthroughProps = { clips: [] }

export function VideoRoot() {
  return (
    <>
      <Composition
        id="HarbrWalkthrough"
        component={Walkthrough}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={1}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: totalFrames(props.clips),
        })}
      />
      <Composition
        id="HarbrAlso"
        component={AlsoScene}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={alsoFrames}
      />
    </>
  )
}
