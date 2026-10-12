// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL CONFIGURATION — every dimension, range, limit and speed lives here.
// Units: metres, seconds, degrees (unless a name says rad). Robot-local frame:
//   +Z = forward, +X = robot LEFT, +Y = up.  Positive yaw = counter-clockwise (left turn).
// ─────────────────────────────────────────────────────────────────────────────
export const CONFIG = {
  chassis: { length: 0.52, width: 0.34, height: 0.10, clearance: 0.05, collisionRadius: 0.30, mass: 6.0, deckHeight: 0.15 },
  wheel: { radius: 0.07, width: 0.05, track: 0.40, wheelbase: 0.34 },
  drive: { maxSpeed: 0.8, maxTurnRate: 2.2, accel: 2.0, turnAccel: 7.0 },

  irSensors: {
    forwardOffset: 0.23,      // distance of IR bar ahead of robot centre
    height: 0.035,            // sensor height above floor
    lineWidth: 0.05,          // black tape width
    falloff: 0.03,            // analog response fall-off beyond the tape edge
    followGain: 9,            // steering gain (rad/s per metre of line error)
    intersectionMinSensors: 4,
    spots: [
      { name: 'farLeft', x: 0.12 }, { name: 'left', x: 0.06 }, { name: 'center', x: 0 },
      { name: 'right', x: -0.06 }, { name: 'farRight', x: -0.12 },
    ],
  },

  ultrasonic: {
    maxRange: 2.5, minRange: 0.03, coneDeg: 30, stopDist: 0.25, slowDist: 0.8,
    sensors: {
      front: { x: 0, y: 0.095, z: 0.29, yaw: 0 },
      left: { x: 0.175, y: 0.10, z: 0.06, yaw: 90 },
      right: { x: -0.175, y: 0.10, z: 0.06, yaw: -90 },
    },
  },

  camera: {
    head: { x: 0, y: 0.43, z: 0.20 }, lensSeparation: 0.09,
    vfov: 45, hfov: 73, detectRange: 3.5, panLimit: 60, tiltLimit: 30,
  },

  arm: {
    baseHeight: 0.30,       // absolute height of the boom hinge
    boomLength: 0.55,       // retracted boom length (hinge → wrist)
    extMax: 0.35,           // telescopic extension
    gripperDrop: 0.12,      // wrist → gripper pad centre (gripper hangs vertically)
    boomMin: -25, boomMax: 80,
    yawRate: 60, boomRate: 30, extRate: 0.15, gripRate: 1.2,
    gripMinWidth: 0.02, gripMaxWidth: 0.16,
    mass: 1.4, maxPayload: 0.8,
    standoff: 0.65,         // robot-to-object distance used by pick/place
    pickYawOffset: 25,      // pick with the boom 25° off-centre so it clears the camera mast
    home: { yaw: 180, boom: 25, ext: 0, grip: 0.3 },
    carry: { boom: 45, ext: 0.05 },
  },

  navigation: { avoidOffset: 0.75 },
}
