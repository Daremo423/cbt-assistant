import beepSound from '../../assets/sounds/alert-beep.wav';

export function playBeep() {
  const audio = new Audio(beepSound);
  audio.play();
}