import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Series,
  staticFile,
  useCurrentFrame,
} from 'remotion'

const background = '#111111'
const cream = '#F9F7F3'
const gold = '#C89D65'
const muted = '#6F6862'
const splashFrames = 102
export const alsoFrames = 135
const endFrames = 120

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
      endFrames + alsoFrames,
    ),
  )
}

function Splash({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 14, 84, 101], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        color: cream,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          opacity,
        }}
      >
        <div
          style={{
            color: muted,
            fontFamily: 'JetBrains Mono, Menlo, monospace',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 5,
            marginBottom: 20,
          }}
        >
          {clip.number} / 04
        </div>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 122,
            fontWeight: 500,
            lineHeight: 1.05,
            maxWidth: 1680,
          }}
        >
          {clip.title}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function AlsoScene() {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 16, 117, 134], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        color: cream,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ opacity, textAlign: 'center' }}>
        <div
          style={{
            color: muted,
            fontFamily: 'JetBrains Mono, Menlo, monospace',
            fontSize: 23,
            fontWeight: 500,
            letterSpacing: 5,
            marginBottom: 35,
          }}
        >
          ALSO
        </div>
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          {[
            'Mouse support (if you really need it)',
            'Herdr supported',
            'Monorepo quick navigation',
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                textAlign: 'left',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 69,
                fontWeight: 500,
                lineHeight: 1.25,
              }}
            >
              <span style={{ color: gold, flex: '0 0 46px' }}>·</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function EndScene() {
  const frame = useCurrentFrame()
  const headingOpacity = interpolate(frame, [0, 18, 103, 119], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const urlOpacity = interpolate(frame, [35, 51, 103, 119], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        color: cream,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 148,
          fontWeight: 500,
          lineHeight: 1,
          opacity: headingOpacity,
        }}
      >
        Try Harbr
      </div>
      <div
        style={{
          color: muted,
          fontFamily: 'JetBrains Mono, Menlo, monospace',
          fontSize: 32,
          fontWeight: 500,
          marginTop: 35,
          opacity: urlOpacity,
        }}
      >
        github.com/dev-town/harbr
      </div>
    </AbsoluteFill>
  )
}

function ClipVideo({ clip }: { clip: Clip }) {
  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <OffthreadVideo
        src={staticFile(clip.file)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </AbsoluteFill>
  )
}

export function Walkthrough({ clips }: WalkthroughProps) {
  const introAndFeatures = clips.filter((clip) => clip.kind !== 'outro')
  const outros = clips.filter((clip) => clip.kind === 'outro')

  return (
    <Series>
      {introAndFeatures.flatMap((clip) => [
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
      <Series.Sequence durationInFrames={alsoFrames}>
        <AlsoScene />
      </Series.Sequence>
      <Series.Sequence durationInFrames={endFrames}>
        <EndScene />
      </Series.Sequence>
      {outros.map((clip) => (
        <Series.Sequence key={clip.file} durationInFrames={clip.frames}>
          <ClipVideo clip={clip} />
        </Series.Sequence>
      ))}
    </Series>
  )
}
