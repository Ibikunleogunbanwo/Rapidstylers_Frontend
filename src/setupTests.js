// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom does not implement AnimationEvent, and react-dom only registers its
// animation event listeners when the interface exists in the window
// (`getVendorPrefixedEventName` deletes the unprefixed "animationend" entry
// otherwise). Without this shim `onAnimationEnd` never fires in tests, so a
// component that clears state when its CSS animation finishes looks broken.
// This must run before react-dom is imported, which is why it lives here.
if (typeof window !== 'undefined' && !('AnimationEvent' in window)) {
  window.AnimationEvent = class AnimationEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.animationName = init.animationName ?? '';
      this.elapsedTime = init.elapsedTime ?? 0;
      this.pseudoElement = init.pseudoElement ?? '';
    }
  };
}
