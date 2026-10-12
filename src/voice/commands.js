import * as A from '../sim/actions'
import { say } from './speech'
import { useUI } from '../store/uiStore'

// Command grammar. First matching rule wins. A rule returns a string to be spoken, or nothing
// if the action already speaks for itself.
const RULES = [
  [/\b(emergency stop|e stop)\b/, () => A.emergencyStop()],
  [/\b(release emergency|clear emergency|resume operation)\b/, () => A.releaseEstop()],
  [/rotate (the )?arm( by)? (\d+)( degrees?)?( (clockwise|anti ?clockwise|counter ?clockwise))?/, (m) => A.armRotateBy(+m[3], !/anti|counter/.test(m[6] || ''))],
  [/rotate (the )?arm (clockwise|anti ?clockwise|counter ?clockwise)/, (m) => A.armRotateBy(90, !/anti|counter/.test(m[2]))],
  [/(raise|lift|up) (the )?(arm|boom)/, () => { A.armNudge({ boom: 20 }); return 'Raising the arm.' }],
  [/(lower|down) (the )?(arm|boom)/, () => { A.armNudge({ boom: -20 }); return 'Lowering the arm.' }],
  [/extend (the )?arm/, () => { A.armNudge({ ext: 0.12 }); return 'Extending the arm.' }],
  [/retract (the )?arm/, () => { A.armNudge({ ext: -0.12 }); return 'Retracting the arm.' }],
  [/open (the )?gripper/, () => A.gripper(true)],
  [/close (the )?gripper/, () => A.gripper(false)],
  [/(pick up|pickup|grab|pick) (the )?(object|box|crate|item)?/, () => { A.pickUp(); return 'Picking up the object.' }],
  [/(place|put down|drop|deliver) (the )?(object|box|crate|item)?/, () => { A.placeObject(); return 'Placing the object.' }],
  [/(return|go|come) (to )?(the )?(home|base|start)/, () => A.returnHome()],
  [/(activate|enable|start|switch to|engage) (the )?(autonomous|auto)( mode)?/, () => A.setMode('autonomous')],
  [/(switch to|activate|enable|go to) (the )?manual( mode)?/, () => A.setMode('manual')],
  [/what (is|do you see) (in front|ahead)|what('| i)?s in front/, () => A.describeFront()],
  [/(report|status).*(sensor|status)|sensor status|report status/, () => A.sensorReport()],
  [/(move|go|drive) (forward|ahead)|^forward$/, () => A.moveForward()],
  [/(move|go|drive) (back|backward|backwards|reverse)|^(back|reverse)$/, () => A.moveBackward()],
  [/turn (to the )?left|^left$/, () => A.turnRobot(90)],
  [/turn (to the )?right|^right$/, () => A.turnRobot(-90)],
  [/\b(stop|halt|freeze)\b/, () => A.stopRobot()],
  [/(reset|restart) (the )?(simulation|scenario)/, () => A.resetSim()],
]

export function executeText(raw) {
  const ui = useUI.getState()
  const text = raw.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').replace(/^(hey |ok |okay )?robot[ ,]*/, '').trim()
  if (!text) return
  ui.addLog('user', raw.trim())
  for (const [re, fn] of RULES) {
    const m = text.match(re)
    if (m) { const reply = fn(m); if (typeof reply === 'string') say(reply); return }
  }
  say(`Sorry, I did not understand "${raw.trim()}".`)
}
