export class RadioAudio {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
        this.gainNode.gain.value = 0; // Start muted

        this.isPlaying = false;

        this.modes = {
            intro: 'https://archive.org/download/twin_peaks_soundtrack-vinyl-1990/A1%20-%20Twin%20Peaks%20Theme.mp3',
            redRoom: 'https://archive.org/download/twin_peaks_soundtrack-vinyl-1990/B3%20-%20Dance%20Of%20The%20Dream%20Man.mp3'
        };
        this.currentMode = 'intro';

        this.audioElement = new Audio();
        this.audioElement.crossOrigin = "anonymous";
        this.audioElement.loop = true;

        // Connect audio element to web audio api graph for volume control
        this.trackSource = this.context.createMediaElementSource(this.audioElement);
        this.trackSource.connect(this.gainNode);
    }

    async init() {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
        return this.isPlaying;
    }

    setMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = mode;
            if (this.isPlaying) {
                // Smooth transition
                const currentTime = this.audioElement.currentTime;
                this.audioElement.src = this.modes[mode];
                this.audioElement.play();
            }
        }
    }

    play() {
        this.init();
        this.isPlaying = true;
        this.gainNode.gain.setTargetAtTime(0.8, this.context.currentTime, 0.1);

        // Play current track
        if (!this.audioElement.src || this.audioElement.src !== this.modes[this.currentMode]) {
            this.audioElement.src = this.modes[this.currentMode];
        }
        this.audioElement.play();
    }

    stop() {
        this.isPlaying = false;
        this.gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
        this.audioElement.pause();
    }
}
