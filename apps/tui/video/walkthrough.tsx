import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const splashFrames = 48

export type Clip = {
  file: string
  frames: number
  kind: 'feature' | 'intro' | 'outro'
  number?: string
  title?: string
}

export type WalkthroughProps = { clips: Clip[] }

export function totalFrames(clips: Clip[]) {
  return Math.max(
    1,
    clips.reduce(
      (total, clip) =>
        total + clip.frames + (clip.kind === 'feature' ? splashFrames : 0),
      0,
    ),
  )
}

function Splash({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 110 },
  })
  const opacity = interpolate(frame, [0, 10, 37, 47], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(130deg, #11111b 0%, #181825 58%, #1e1e2e 100%)',
        color: '#cdd6f4',
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 92,
          left: 112,
          fontSize: 27,
          fontWeight: 800,
          letterSpacing: 5,
          color: '#89b4fa',
          opacity,
        }}
      >
        HARBR
      </div>
      <div
        style={{
          position: 'absolute',
          left: 112,
          right: 112,
          top: 217,
          height: 2,
          background: '#45475a',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 112,
          top: 262,
          fontSize: 30,
          fontWeight: 700,
          color: '#a6adc8',
          opacity,
        }}
      >
        {clip.number} / FEATURE
      </div>
      <div
        style={{
          position: 'absolute',
          left: 104,
          top: 360,
          maxWidth: 1450,
          fontFamily: 'Inter, Helvetica, sans-serif',
          fontSize: 112,
          fontWeight: 750,
          letterSpacing: -5,
          lineHeight: 1.05,
          transform: `translateY(${(1 - progress) * 70}px)`,
          opacity,
        }}
      >
        {clip.title}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 112,
          bottom: 140,
          width: 330 * progress,
          height: 8,
          background: '#a6e3a1',
          opacity,
        }}
      />
    </AbsoluteFill>
  )
}

function ClipVideo({ clip }: { clip: Clip }) {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0f19' }}>
      <OffthreadVideo
        src={staticFile(clip.file)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </AbsoluteFill>
  )
}

export function Walkthrough({ clips }: WalkthroughProps) {
  return (
    <Series>
      {clips.flatMap((clip) => [
        ...(clip.kind === 'feature'
          ? [
              <Series.Sequence
                key={`${clip.file}-splash`}
                durationInFrames={splashFrames}
              >
                <Splash clip={clip} />
              </Series.Sequence>,
            ]
          : []),
        <Series.Sequence key={clip.file} durationInFrames={clip.frames}>
          <ClipVideo clip={clip} />
        </Series.Sequence>,
      ])}
    </Series>
  )
}
