# Audio assets

Just Bubbles currently **synthesises** its pop sounds live in the browser
using the Web Audio API (see `js/audio.js`), so no audio files are
required for the app to work out of the box.

This folder is here so you have an obvious place to drop real recorded
pop sounds if you'd rather use those instead — for example:

- `pop-classic.mp3`
- `pop-soft.mp3`
- `pop-playful.mp3`

See the comment block at the bottom of `js/audio.js` ("HOW TO REPLACE
THESE SOUNDS WITH AUDIO FILES") for the exact code change needed to
switch from synthesised sounds to files in this folder.
