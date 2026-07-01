#!/usr/bin/env bun

type ArtifactTarget =
  | 'darwin-arm64'
  | 'darwin-x64'
  | 'linux-arm64'
  | 'linux-x64'

type ReleaseManifest = {
  artifacts: Array<{
    name: string
    sha256: string
    target: ArtifactTarget
  }>
  version: string
}

function readArg(name: string): string | undefined {
  const index = Bun.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return Bun.argv[index + 1]
}

const formulaPath = readArg('--formula')
const manifestPath = readArg('--manifest') ?? 'dist/release/manifest.json'
const repository = readArg('--repository') ?? 'dev-town/harbr'

if (!formulaPath) {
  console.error(
    'Usage: bun scripts/update-homebrew-formula.ts --formula <path>',
  )
  process.exit(1)
}

const manifest = (await Bun.file(manifestPath).json()) as ReleaseManifest
const artifacts = new Map(
  manifest.artifacts.map((artifact) => [artifact.target, artifact]),
)

function artifact(
  target: ArtifactTarget,
): ReleaseManifest['artifacts'][number] {
  const match = artifacts.get(target)

  if (!match) {
    console.error(`Missing ${target} artifact in ${manifestPath}.`)
    process.exit(1)
  }

  return match
}

function artifactUrl(target: ArtifactTarget): string {
  return `https://github.com/${repository}/releases/download/v${manifest.version}/${artifact(target).name}`
}

const formula = `class Harbr < Formula
  desc "Workspace-aware terminal project manager"
  homepage "https://github.com/${repository}"
  version "${manifest.version}"
  license "MIT"

  livecheck do
    url :stable
    regex(/^v?(\\d+(?:\\.\\d+)+(?:-[0-9A-Za-z.-]+)?)$/i)
    strategy :github_releases do |json, regex|
      json.filter_map do |release|
        next if release["draft"]

        release["tag_name"]&.[](regex, 1)
      end
    end
  end

  on_macos do
    if Hardware::CPU.arm?
      url "${artifactUrl('darwin-arm64')}"
      sha256 "${artifact('darwin-arm64').sha256}"
    else
      url "${artifactUrl('darwin-x64')}"
      sha256 "${artifact('darwin-x64').sha256}"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "${artifactUrl('linux-arm64')}"
      sha256 "${artifact('linux-arm64').sha256}"
    else
      url "${artifactUrl('linux-x64')}"
      sha256 "${artifact('linux-x64').sha256}"
    end
  end

  def install
    bin.install "harbr"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/harbr --version")
  end
end
`

await Bun.write(formulaPath, formula)
console.log(`Updated ${formulaPath} for harbr ${manifest.version}.`)
