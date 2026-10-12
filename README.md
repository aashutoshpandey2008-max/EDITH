# VISHWAKARMA — Autonomous Mobile Robot · Browser Digital Twin

Interactive 3D simulation of the Vishwakarma multipurpose robot: 4-wheel differential drive, IR line following,
ultrasonic obstacle handling, dual cameras, microphone + speaker, and a long 360° crane-style arm with gripper.
React + Vite · Three.js / React Three Fiber · Drei · Tailwind · Zustand · Web Speech API. No paid APIs, no hardware.

## Run

```bash
npm install
npm run dev        # open the printed localhost URL in Chrome or Edge
```

Voice recognition needs Chrome/Edge on `localhost` or HTTPS (and microphone permission). Everything else works in any
WebGL browser, and typed commands are always available as a fallback.

### Blank page? (most common cause)
This is a Vite + React app. **Do not open `index.html` directly or run Live Server on the project folder** — browsers cannot run
`src/main.jsx`, so nothing renders. Use `npm run dev` (needs Node 18+) and open the URL it prints.
If you want to use Live Server: run `npm run build`, then open **`dist/index.html`** with Live Server.
If the page shows an error message, press F12 and check the console. WebGL must be enabled in the browser.

## Controls

| Input | Action |
|---|---|
| W A S D / arrows (or hold the D-pad) | Drive (manual mode) |
| Space | Emergency stop (button toggles release) |
| Mouse | Orbit / zoom / pan (Orbit, Front, Side, Top views) |
| View bar | Orbit · Front · Side · Top · Follow · First-person (through the left camera lens) |
| Left panel | Scenario picker, Start/Pause/Reset, add/remove obstacles, debug/labels/cones/FOV toggles, mode, speed, arm sliders & buttons |
| Right panel | IR + ultrasonic readings, nav state, detections, live stereo camera feeds, head pan/tilt, voice console |

### Scenarios
A manual navigation · B autonomous line following · C obstacle avoidance (obstacles on the line) ·
D arm operation (robot parked at pickup) · E pick-and-place (press **Pick&Place**; one box is deliberately 1.5 kg to show the
0.8 kg payload limit) · F voice control.

### Voice / text commands
"move forward", "turn left/right", "stop", "activate autonomous mode", "switch to manual mode", "rotate arm 90 degrees",
"rotate arm 360 degrees", "raise/lower the arm", "extend/retract the arm", "open/close the gripper", "pick up the object",
"place the object", "return to home position", "what is in front of you", "report sensor status", "emergency stop".
A leading "Robot," is optional. Responses are logged and spoken (mute + volume in the voice panel).

## How it works

- **Frames:** robot-local +Z forward, +X left. Positive yaw = counter-clockwise (left). Units are metres/degrees.
- **Simulation loop:** fixed 60 Hz step → `sensors → navigation → drive physics → arm → payload → boxes`.
  Visuals only *read* the mutable state `S` (`src/sim/state.js`); UI panels poll snapshots at ~8 Hz.
- **IR sensors (5):** distance to the black track → analog response; used for line following only.
  Centre/left/right steering, intersection rule (straight/left/right/alternate), and line-lost handling
  (recovery sweep or stop) are configurable.
- **Ultrasonic (front, left, right):** 9-ray cone model, 2.5 m range, live cm readout, visible cones.
  Slows → stops → waits for the path to clear → side-steps and rejoins the line (or resumes the goto).
  Manual mode has an optional collision guard that uses the same sensor.
- **Cameras:** each lens is rendered into an offscreen target and drawn to the dashboard (≈12 fps).
- **Arm:** hinge/boom/telescope/gripper kinematics with joint limits, ground-contact limit, tip-over (stability) limit,
  inverse-kinematics reach solver, payload attachment and weight limit. The gripper hangs vertically (auto-levelled wrist).
  The arm is one rigid hierarchy on the chassis, so it stays attached in every pose.

## Project structure

```
src/
  config/robotConfig.js     ← ALL dimensions, ranges, limits, speeds
  sim/                      state · world · sensors · raycast · physics · arm ·
                            NavigationController · tasks · scenarios · actions · engine
  voice/                    VoiceController (mic) · commands (grammar) · speech (TTS)
  vision/                   detector (MetadataDetector) · feedRegistry
  components/               Scene · Environment3D
  components/robot/         RobotBase · WheelAssembly · IRSensorArray · UltrasonicSensor ·
                            CameraHead · MicrophoneModule · SpeakerModule · CraneArm · Gripper
  ui/                       Dashboard panels incl. SensorDashboard
```
Change a dimension (e.g. `arm.boomLength`, `arm.extMax`, `ultrasonic.maxRange`) in `robotConfig.js`; geometry, kinematics and
limits follow. (A few purely decorative sizes inside the 3D components are fixed numbers.)

## Honest limitations (simplified / mocked)

- **Object detection is SIMULATED.** Boxes/labels come from scene metadata plus FOV, range and line-of-sight tests —
  not computer vision. `MetadataDetector.detect()` is the swap-in point for OpenCV/YOLO; the lens renders are available as pixels.
- **Physics:** custom deterministic 2-D collision (circle vs boxes/cylinders) instead of Rapier. The arm does not collide
  with the world, only with the floor. Crates are solid but are not pushed by the robot. Tip-over is a static centre-of-mass check.
- **Sensors:** ideal (no noise, ambient-light effects, or ultrasonic specular reflection); ultrasonic is a ray-cone approximation.
- **Grasping:** a box is "gripped" when the pad centre is within ~4 cm and the jaws close to its width — no contact friction model.
- **Terrain:** flat ground only (ramps/uneven terrain not implemented yet).
- **Rear obstacles:** no rear sensor, so reversing is unguarded.
- **Voice:** rule-based command matching, not natural-language understanding.
- **Not yet run-tested in a browser by the author of this scaffold:** the simulation logic was verified headlessly (line following,
  obstacle avoidance, pick-and-place), but the React/Three rendering was written without an `npm install` available. If you see a
  runtime error in the console, send it over and it can be fixed quickly.

## Hardware notes for the physical prototype

- **Continuous 360° base rotation needs a slip ring** (for motor/sensor wiring) or a rotation limit / cable-wrap scheme.
- Reflective IR sensors are sensitive to ambient light and surface finish — calibrate thresholds on the real floor; keep them
  for line detection only. Ultrasonic sensors miss soft/angled surfaces and have wide cones.
- A long boom with payload shifts the centre of mass: confirm the real wheelbase/track, battery placement and payload limit
  (the sim's stability margin uses `robotConfig.js` values you should replace with measured ones).
- Dual-camera object detection will need its own compute (e.g. Raspberry Pi/Jetson) and calibration.
