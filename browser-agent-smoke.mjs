export const CLOUD_ASSISTED_READBACK_MARKER = 'cloud-assisted-readback';
export const SOVEREIGN_DISPATCHER_MARKER = 'sovereign-dispatcher';
export const GEMINI_VISION_LANE_MARKER = 'gemini-cloud-vision-lane';

export function smokeMarkers() {
  return {
    ok: true,
    markers: [
      CLOUD_ASSISTED_READBACK_MARKER,
      SOVEREIGN_DISPATCHER_MARKER,
      GEMINI_VISION_LANE_MARKER,
    ],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(smokeMarkers(), null, 2));
}
