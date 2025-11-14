class AmbientMusicGenerator {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;

        // Tone generators
        this.oscillators = [];
        this.toneGain = null;

        // Noise generators
        this.noiseNodes = {
            rain: null,
            water: null,
            static: null,
            metallic: null,
            wind: null
        };

        this.noiseGains = {
            rain: null,
            water: null,
            static: null,
            metallic: null,
            wind: null
        };

        // Effects
        this.masterGain = null;
        this.reverbNode = null;
        this.delayNode = null;
        this.delayFeedback = null;
        this.delayGain = null;

        // Parameters
        this.params = {
            rootNote: 440,
            frequency: 1,
            phasing: 0,
            harmonics: 3,
            toneVolume: 0.3,
            rain: 0,
            water: 0,
            static: 0,
            metallic: 0,
            wind: 0,
            reverb: 0.5,
            delay: 0
        };

        this.initControls();
    }

    initControls() {
        // Tone controls
        document.getElementById('rootNote').addEventListener('input', (e) => {
            this.params.rootNote = parseFloat(e.target.value);
            document.getElementById('rootNoteValue').textContent =
                this.frequencyToNote(this.params.rootNote);
            this.updateTones();
        });

        document.getElementById('frequency').addEventListener('input', (e) => {
            this.params.frequency = parseFloat(e.target.value);
            document.getElementById('frequencyValue').textContent =
                this.params.frequency.toFixed(1) + 'x';
            this.updateTones();
        });

        document.getElementById('phasing').addEventListener('input', (e) => {
            this.params.phasing = parseFloat(e.target.value);
            document.getElementById('phasingValue').textContent =
                this.params.phasing.toFixed(2) + ' Hz';
            this.updateTones();
        });

        document.getElementById('harmonics').addEventListener('input', (e) => {
            this.params.harmonics = parseInt(e.target.value);
            document.getElementById('harmonicsValue').textContent = this.params.harmonics;
            if (this.isPlaying) {
                this.stopTones();
                this.startTones();
            }
        });

        document.getElementById('toneVolume').addEventListener('input', (e) => {
            this.params.toneVolume = parseFloat(e.target.value) / 100;
            document.getElementById('toneVolumeValue').textContent = e.target.value + '%';
            if (this.toneGain) {
                this.toneGain.gain.setTargetAtTime(this.params.toneVolume, this.audioContext.currentTime, 0.1);
            }
        });

        // Noise controls
        const noiseTypes = ['rain', 'water', 'static', 'metallic', 'wind'];
        noiseTypes.forEach(type => {
            document.getElementById(type).addEventListener('input', (e) => {
                this.params[type] = parseFloat(e.target.value) / 100;
                document.getElementById(type + 'Value').textContent = e.target.value + '%';
                if (this.noiseGains[type]) {
                    this.noiseGains[type].gain.setTargetAtTime(
                        this.params[type] * 0.5,
                        this.audioContext.currentTime,
                        0.1
                    );
                }
            });
        });

        // Effects controls
        document.getElementById('reverb').addEventListener('input', (e) => {
            this.params.reverb = parseFloat(e.target.value) / 100;
            document.getElementById('reverbValue').textContent = e.target.value + '%';
            if (this.reverbNode) {
                this.updateReverb();
            }
        });

        document.getElementById('delay').addEventListener('input', (e) => {
            this.params.delay = parseFloat(e.target.value) / 100;
            document.getElementById('delayValue').textContent = e.target.value + '%';
            if (this.delayGain) {
                this.delayGain.gain.setTargetAtTime(this.params.delay, this.audioContext.currentTime, 0.1);
            }
        });

        // Start/Stop buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
    }

    frequencyToNote(freq) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const a4 = 440;
        const c0 = a4 * Math.pow(2, -4.75);
        const halfSteps = Math.round(12 * Math.log2(freq / c0));
        const octave = Math.floor(halfSteps / 12);
        const note = noteNames[halfSteps % 12];
        return `${note}${octave}`;
    }

    async start() {
        if (this.isPlaying) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = true;

        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;

        // Create master gain
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.8;

        // Create effects
        await this.createReverb();
        this.createDelay();

        // Create tone generators
        this.toneGain = this.audioContext.createGain();
        this.toneGain.gain.value = this.params.toneVolume;
        this.startTones();

        // Create noise generators
        this.startNoises();

        // Connect master gain to destination
        this.masterGain.connect(this.audioContext.destination);
    }

    stop() {
        if (!this.isPlaying) return;

        this.stopTones();
        this.stopNoises();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isPlaying = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
    }

    startTones() {
        this.oscillators = [];

        for (let i = 0; i < this.params.harmonics; i++) {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Create harmonics with decreasing volume
            const harmonic = i + 1;
            const freq = this.params.rootNote * this.params.frequency * harmonic;

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Add phasing (slight frequency modulation)
            if (this.params.phasing > 0) {
                const lfo = this.audioContext.createOscillator();
                const lfoGain = this.audioContext.createGain();
                lfo.frequency.value = this.params.phasing;
                lfoGain.gain.value = 2 + (i * 0.5); // Slight detuning
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfo.start();
            }

            // Volume decreases with each harmonic
            gainNode.gain.value = 1 / (harmonic * harmonic);

            osc.connect(gainNode);
            gainNode.connect(this.toneGain);

            // Connect to effects
            this.toneGain.connect(this.delayNode);
            this.toneGain.connect(this.reverbNode);
            this.delayNode.connect(this.masterGain);
            this.reverbNode.connect(this.masterGain);

            osc.start();
            this.oscillators.push({ osc, gainNode });
        }
    }

    stopTones() {
        this.oscillators.forEach(({ osc }) => {
            osc.stop();
        });
        this.oscillators = [];
    }

    updateTones() {
        if (!this.isPlaying) return;

        this.oscillators.forEach(({ osc, gainNode }, i) => {
            const harmonic = i + 1;
            const freq = this.params.rootNote * this.params.frequency * harmonic;
            osc.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.1);
        });
    }

    startNoises() {
        // Rain noise
        this.noiseNodes.rain = this.createNoiseBuffer('rain');
        this.noiseGains.rain = this.audioContext.createGain();
        this.noiseGains.rain.gain.value = this.params.rain * 0.5;
        this.connectNoise(this.noiseNodes.rain, this.noiseGains.rain);

        // Water noise
        this.noiseNodes.water = this.createNoiseBuffer('water');
        this.noiseGains.water = this.audioContext.createGain();
        this.noiseGains.water.gain.value = this.params.water * 0.5;
        this.connectNoise(this.noiseNodes.water, this.noiseGains.water);

        // Static noise
        this.noiseNodes.static = this.createNoiseBuffer('static');
        this.noiseGains.static = this.audioContext.createGain();
        this.noiseGains.static.gain.value = this.params.static * 0.5;
        this.connectNoise(this.noiseNodes.static, this.noiseGains.static);

        // Metallic hum
        this.noiseNodes.metallic = this.createMetallicHum();
        this.noiseGains.metallic = this.audioContext.createGain();
        this.noiseGains.metallic.gain.value = this.params.metallic * 0.5;
        this.connectNoise(this.noiseNodes.metallic, this.noiseGains.metallic);

        // Wind noise
        this.noiseNodes.wind = this.createNoiseBuffer('wind');
        this.noiseGains.wind = this.audioContext.createGain();
        this.noiseGains.wind.gain.value = this.params.wind * 0.5;
        this.connectNoise(this.noiseNodes.wind, this.noiseGains.wind);
    }

    createNoiseBuffer(type) {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            switch(type) {
                case 'rain':
                    // Rain: sporadic high-frequency noise
                    data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.1);
                    break;
                case 'water':
                    // Water: smooth flowing noise
                    data[i] = (Math.random() * 2 - 1) * 0.5;
                    break;
                case 'static':
                    // Static: pure white noise
                    data[i] = Math.random() * 2 - 1;
                    break;
                case 'wind':
                    // Wind: low-frequency rumble
                    data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.01);
                    break;
            }
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Add filtering based on noise type
        const filter = this.audioContext.createBiquadFilter();
        switch(type) {
            case 'rain':
                filter.type = 'highpass';
                filter.frequency.value = 1000;
                break;
            case 'water':
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 0.5;
                break;
            case 'static':
                filter.type = 'highpass';
                filter.frequency.value = 500;
                break;
            case 'wind':
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                break;
        }

        source.connect(filter);
        return { source, filter };
    }

    createMetallicHum() {
        // Metallic hum: multiple sine waves at harmonic intervals
        const fundamentalFreq = 60; // 60 Hz hum
        const oscillators = [];
        const merger = this.audioContext.createChannelMerger(1);

        for (let i = 1; i <= 5; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = fundamentalFreq * i;
            gain.gain.value = 0.3 / i;

            // Add slight frequency modulation for metallic character
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.frequency.value = 0.5 + (i * 0.1);
            lfoGain.gain.value = 0.5;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();

            osc.connect(gain);
            gain.connect(merger);
            osc.start();
            oscillators.push(osc);
        }

        return { source: merger, filter: null };
    }

    connectNoise(noiseNode, gainNode) {
        if (noiseNode.filter) {
            noiseNode.filter.connect(gainNode);
        } else {
            noiseNode.source.connect(gainNode);
        }

        gainNode.connect(this.reverbNode);
        gainNode.connect(this.masterGain);

        if (noiseNode.source.start) {
            noiseNode.source.start();
        }
    }

    stopNoises() {
        Object.values(this.noiseNodes).forEach(node => {
            if (node && node.source) {
                if (node.source.stop) {
                    node.source.stop();
                }
            }
        });
    }

    async createReverb() {
        // Create a simple reverb using convolver
        this.reverbNode = this.audioContext.createGain();
        this.updateReverb();
    }

    updateReverb() {
        if (this.reverbNode) {
            this.reverbNode.gain.setTargetAtTime(
                this.params.reverb,
                this.audioContext.currentTime,
                0.1
            );
        }
    }

    createDelay() {
        this.delayNode = this.audioContext.createDelay(5.0);
        this.delayNode.delayTime.value = 0.5;

        this.delayFeedback = this.audioContext.createGain();
        this.delayFeedback.gain.value = 0.4;

        this.delayGain = this.audioContext.createGain();
        this.delayGain.gain.value = this.params.delay;

        // Create delay feedback loop
        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.delayGain);
        this.delayGain.connect(this.masterGain);
    }
}

// Initialize the app
const app = new AmbientMusicGenerator();
