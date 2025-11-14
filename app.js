class AmbientMusicGenerator {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;

        // Complex drone engine
        this.droneEngine = null;

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
            if (this.droneEngine) {
                this.droneEngine.updateRoot(this.params.rootNote * this.params.frequency);
            }
        });

        document.getElementById('frequency').addEventListener('input', (e) => {
            this.params.frequency = parseFloat(e.target.value);
            document.getElementById('frequencyValue').textContent =
                this.params.frequency.toFixed(1) + 'x';
            if (this.droneEngine) {
                this.droneEngine.updateRoot(this.params.rootNote * this.params.frequency);
            }
        });

        document.getElementById('phasing').addEventListener('input', (e) => {
            this.params.phasing = parseFloat(e.target.value);
            document.getElementById('phasingValue').textContent =
                this.params.phasing.toFixed(2) + ' Hz';
            if (this.droneEngine) {
                this.droneEngine.updatePhasing(this.params.phasing);
            }
        });

        document.getElementById('harmonics').addEventListener('input', (e) => {
            this.params.harmonics = parseInt(e.target.value);
            document.getElementById('harmonicsValue').textContent = this.params.harmonics;
            if (this.droneEngine) {
                this.droneEngine.setComplexity(this.params.harmonics);
            }
        });

        document.getElementById('toneVolume').addEventListener('input', (e) => {
            this.params.toneVolume = parseFloat(e.target.value) / 100;
            document.getElementById('toneVolumeValue').textContent = e.target.value + '%';
            if (this.droneEngine) {
                this.droneEngine.setMasterVolume(this.params.toneVolume);
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

        // Create complex drone engine
        this.droneEngine = new ComplexDroneEngine(
            this.audioContext,
            this.reverbNode,
            this.delayNode,
            this.masterGain
        );
        this.droneEngine.start(
            this.params.rootNote * this.params.frequency,
            this.params.harmonics,
            this.params.toneVolume,
            this.params.phasing
        );

        // Create noise generators
        this.startNoises();

        // Connect master gain to destination
        this.masterGain.connect(this.audioContext.destination);
    }

    stop() {
        if (!this.isPlaying) return;

        if (this.droneEngine) {
            this.droneEngine.stop();
            this.droneEngine = null;
        }

        this.stopNoises();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isPlaying = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
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
                    data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.1);
                    break;
                case 'water':
                    data[i] = (Math.random() * 2 - 1) * 0.5;
                    break;
                case 'static':
                    data[i] = Math.random() * 2 - 1;
                    break;
                case 'wind':
                    data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.01);
                    break;
            }
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

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
        const fundamentalFreq = 60;
        const oscillators = [];
        const merger = this.audioContext.createChannelMerger(1);

        for (let i = 1; i <= 5; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = fundamentalFreq * i;
            gain.gain.value = 0.3 / i;

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

        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.delayGain);
        this.delayGain.connect(this.masterGain);
    }
}

// ============================================================================
// COMPLEX DRONE ENGINE
// ============================================================================

class ComplexDroneEngine {
    constructor(audioContext, reverbNode, delayNode, masterGain) {
        this.ctx = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
        this.masterGain = masterGain;

        // Synthesis layers
        this.layers = {
            justIntonation: [],
            harmonicSeries: [],
            subharmonic: [],
            goldenRatio: [],
            fibonacci: []
        };

        // Layer gain nodes
        this.layerGains = {
            justIntonation: null,
            harmonicSeries: null,
            subharmonic: null,
            goldenRatio: null,
            fibonacci: null
        };

        // FM synthesis
        this.fmPairs = [];

        // LFOs for evolution
        this.lfos = [];

        // Evolution interval
        this.evolutionInterval = null;

        // Master drone gain
        this.droneGain = null;

        this.rootFrequency = 440;
    }

    start(rootFreq, complexity, volume, phasing) {
        this.rootFrequency = rootFreq;

        // Create master drone gain
        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0;
        this.droneGain.connect(this.reverbNode);
        this.droneGain.connect(this.delayNode);
        this.droneGain.connect(this.masterGain);

        // Create layer gains
        Object.keys(this.layerGains).forEach(layer => {
            this.layerGains[layer] = this.ctx.createGain();
            this.layerGains[layer].gain.value = 0;
            this.layerGains[layer].connect(this.droneGain);
        });

        // Create all synthesis layers
        this.createJustIntonationLayer();
        this.createHarmonicSeriesLayer();
        this.createSubharmonicLayer();
        this.createGoldenRatioLayer();
        this.createFibonacciLayer();

        // Setup FM synthesis
        this.setupFM();

        // Create LFOs for evolution
        this.createLFOs();

        // Set complexity and volume
        this.setComplexity(complexity);
        this.setMasterVolume(volume);

        // Start evolution
        this.startEvolution();

        // Fade in
        this.droneGain.gain.setTargetAtTime(1, this.ctx.currentTime, 3);
    }

    stop() {
        // Stop evolution
        if (this.evolutionInterval) {
            clearInterval(this.evolutionInterval);
        }

        // Stop all oscillators
        Object.values(this.layers).forEach(layer => {
            layer.forEach(voice => {
                voice.oscillators.forEach(osc => osc.stop());
                if (voice.lfo) voice.lfo.stop();
            });
        });

        // Stop LFOs
        this.lfos.forEach(lfo => {
            if (lfo.osc) lfo.osc.stop();
        });

        // Stop FM modulators
        this.fmPairs.forEach(pair => {
            if (pair.modulator) pair.modulator.stop();
        });
    }

    createJustIntonationLayer() {
        // Pure intervals: unison, major second, major third, perfect fourth,
        // perfect fifth, major sixth, major seventh, octave
        const ratios = [
            1/1,      // Unison
            9/8,      // Major second
            5/4,      // Major third
            4/3,      // Perfect fourth
            3/2,      // Perfect fifth
            5/3,      // Major sixth
            15/8,     // Major seventh
            2/1       // Octave
        ];

        ratios.forEach((ratio, index) => {
            this.createVoice('justIntonation', ratio, 3, 0.15);
        });
    }

    createHarmonicSeriesLayer() {
        // Harmonic series with decreasing amplitude
        const harmonics = [1, 2, 3, 4, 5, 7, 9, 11, 13];

        harmonics.forEach((harmonic, index) => {
            const amplitude = 0.2 / (harmonic * harmonic);
            this.createVoice('harmonicSeries', harmonic, 2, amplitude);
        });
    }

    createSubharmonicLayer() {
        // Subharmonics - stay above 80Hz
        const ratios = [1, 1/2, 1/3, 1/4];

        ratios.forEach(ratio => {
            const freq = this.rootFrequency * ratio;
            if (freq >= 80) {
                this.createVoice('subharmonic', ratio, 2, 0.25);
            }
        });
    }

    createGoldenRatioLayer() {
        const phi = 1.618033988749;
        const ratios = [
            phi,           // Golden ratio
            phi * phi,     // Phi squared
            1 / phi,       // Inverse phi
            1 / (phi * phi), // Inverse phi squared
            phi / 2,       // Phi over 2
            2 / phi        // 2 over phi
        ];

        ratios.forEach(ratio => {
            this.createVoice('goldenRatio', ratio, 3, 0.12);
        });
    }

    createFibonacciLayer() {
        // Fibonacci ratios
        const ratios = [
            2/3,   // 2:3
            3/5,   // 3:5
            5/8,   // 5:8
            8/13,  // 8:13
            13/21  // 13:21
        ];

        ratios.forEach(ratio => {
            this.createVoice('fibonacci', ratio, 2, 0.15);
        });
    }

    createVoice(layerName, ratio, detuneCount, baseAmplitude) {
        const voice = {
            ratio: ratio,
            oscillators: [],
            gains: [],
            baseAmplitude: baseAmplitude,
            currentAmplitude: baseAmplitude,
            lfo: null
        };

        // Create detuned oscillators for this voice
        for (let i = 0; i < detuneCount; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';

            // Calculate frequency with octave spreading
            let freq = this.rootFrequency * ratio;

            // Octave spreading: some voices go up/down octaves for thickness
            if (layerName === 'harmonicSeries' && ratio > 7) {
                freq = freq / 2; // Bring high harmonics down an octave
            }
            if (layerName === 'goldenRatio' && ratio > 2) {
                freq = freq / 2; // Bring high golden ratios down
            }

            osc.frequency.value = freq;

            // Apply detuning (2-5 cents)
            if (i === 1) {
                const detuneCents = 2 + Math.random() * 3;
                osc.detune.value = detuneCents;
            } else if (i === 2) {
                const detuneCents = -(2 + Math.random() * 3);
                osc.detune.value = detuneCents;
            }

            // Volume distribution across detuned oscillators
            gain.gain.value = baseAmplitude / detuneCount;

            osc.connect(gain);
            gain.connect(this.layerGains[layerName]);
            osc.start();

            voice.oscillators.push(osc);
            voice.gains.push(gain);
        }

        this.layers[layerName].push(voice);
    }

    setupFM() {
        // FM Pair 1: Subharmonic modulates Just Intonation (warmth/rumble)
        if (this.layers.subharmonic.length > 0 && this.layers.justIntonation.length > 0) {
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();

            modulator.frequency.value = this.rootFrequency / 4; // Low frequency
            modGain.gain.value = 0.5; // Subtle modulation index

            modulator.connect(modGain);

            // Connect to first few just intonation voices
            this.layers.justIntonation.slice(0, 3).forEach(voice => {
                voice.oscillators.forEach(osc => {
                    modGain.connect(osc.frequency);
                });
            });

            modulator.start();
            this.fmPairs.push({ modulator, modGain });
        }

        // FM Pair 2: Fibonacci modulates Harmonic series (metallic character)
        if (this.layers.fibonacci.length > 0 && this.layers.harmonicSeries.length > 0) {
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();

            modulator.frequency.value = this.rootFrequency * (3/5); // Fibonacci ratio
            modGain.gain.value = 1.0; // Moderate modulation

            modulator.connect(modGain);

            // Connect to harmonic series
            this.layers.harmonicSeries.slice(0, 4).forEach(voice => {
                voice.oscillators.forEach(osc => {
                    modGain.connect(osc.frequency);
                });
            });

            modulator.start();
            this.fmPairs.push({ modulator, modGain });
        }

        // FM Pair 3: Golden ratio modulates everything subtly (drift)
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();

        modulator.frequency.value = this.rootFrequency * 1.618 / 4;
        modGain.gain.value = 0.3; // Very subtle

        modulator.connect(modGain);

        // Connect to a selection of voices from all layers
        Object.values(this.layers).forEach(layer => {
            if (layer.length > 0) {
                layer[0].oscillators.forEach(osc => {
                    modGain.connect(osc.frequency);
                });
            }
        });

        modulator.start();
        this.fmPairs.push({ modulator, modGain });
    }

    createLFOs() {
        // Ultra-slow LFOs modulating layer volumes
        const lfoFreqs = [0.017, 0.023, 0.031, 0.013, 0.019]; // 20-60 second cycles
        const layerNames = Object.keys(this.layerGains);

        lfoFreqs.forEach((freq, index) => {
            if (index < layerNames.length) {
                const lfo = this.ctx.createOscillator();
                const lfoGain = this.ctx.createGain();

                lfo.type = 'sine';
                lfo.frequency.value = freq;

                // Modulate layer gain (subtle breathing)
                lfoGain.gain.value = 0.05; // 5% variation

                lfo.connect(lfoGain);
                lfoGain.connect(this.layerGains[layerNames[index]].gain);

                lfo.start();

                this.lfos.push({ osc: lfo, gain: lfoGain, target: layerNames[index] });
            }
        });
    }

    updatePhasing(phasingHz) {
        // Update user-controlled phasing LFO
        // This modulates fine-tuning of all oscillators

        // Remove old phasing LFO if exists
        const existingPhasing = this.lfos.find(lfo => lfo.phasing);
        if (existingPhasing && existingPhasing.osc) {
            existingPhasing.osc.stop();
            const index = this.lfos.indexOf(existingPhasing);
            this.lfos.splice(index, 1);
        }

        if (phasingHz > 0) {
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();

            lfo.type = 'sine';
            lfo.frequency.value = phasingHz;
            lfoGain.gain.value = 2; // ±2 Hz modulation

            lfo.connect(lfoGain);

            // Connect to all oscillators
            Object.values(this.layers).forEach(layer => {
                layer.forEach(voice => {
                    voice.oscillators.forEach(osc => {
                        lfoGain.connect(osc.frequency);
                    });
                });
            });

            lfo.start();
            this.lfos.push({ osc: lfo, gain: lfoGain, phasing: true });
        }
    }

    startEvolution() {
        // Dynamic evolution every 30-60 seconds
        this.evolutionInterval = setInterval(() => {
            this.evolve();
        }, (30 + Math.random() * 30) * 1000);
    }

    evolve() {
        // Randomly adjust layer volumes slightly
        Object.entries(this.layerGains).forEach(([name, gain]) => {
            const variation = 0.9 + Math.random() * 0.2; // ±10%
            const currentValue = gain.gain.value;
            const newValue = currentValue * variation;
            gain.gain.setTargetAtTime(newValue, this.ctx.currentTime, 5); // 5 second crossfade
        });

        // Randomly adjust some FM modulation indices
        this.fmPairs.forEach(pair => {
            if (Math.random() > 0.5) {
                const variation = 0.8 + Math.random() * 0.4;
                const currentValue = pair.modGain.gain.value;
                const newValue = Math.max(0.2, Math.min(2, currentValue * variation));
                pair.modGain.gain.setTargetAtTime(newValue, this.ctx.currentTime, 5);
            }
        });

        console.log('Drone evolved...');
    }

    updateRoot(newRootFreq) {
        this.rootFrequency = newRootFreq;

        // Update all oscillators
        Object.entries(this.layers).forEach(([layerName, layer]) => {
            layer.forEach(voice => {
                let freq = this.rootFrequency * voice.ratio;

                // Apply same octave spreading logic
                if (layerName === 'harmonicSeries' && voice.ratio > 7) {
                    freq = freq / 2;
                }
                if (layerName === 'goldenRatio' && voice.ratio > 2) {
                    freq = freq / 2;
                }

                voice.oscillators.forEach(osc => {
                    osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.5);
                });
            });
        });

        // Update FM modulators
        if (this.fmPairs.length >= 3) {
            this.fmPairs[0].modulator.frequency.setTargetAtTime(
                this.rootFrequency / 4, this.ctx.currentTime, 0.5
            );
            this.fmPairs[1].modulator.frequency.setTargetAtTime(
                this.rootFrequency * (3/5), this.ctx.currentTime, 0.5
            );
            this.fmPairs[2].modulator.frequency.setTargetAtTime(
                this.rootFrequency * 1.618 / 4, this.ctx.currentTime, 0.5
            );
        }
    }

    setComplexity(level) {
        // Level 1-8 controls which layers are active
        const layerConfig = {
            1: { justIntonation: 0.8, harmonicSeries: 0, subharmonic: 0, goldenRatio: 0, fibonacci: 0 },
            2: { justIntonation: 0.7, harmonicSeries: 0, subharmonic: 0.6, goldenRatio: 0, fibonacci: 0 },
            3: { justIntonation: 0.6, harmonicSeries: 0.4, subharmonic: 0.7, goldenRatio: 0, fibonacci: 0 },
            4: { justIntonation: 0.6, harmonicSeries: 0.5, subharmonic: 0.7, goldenRatio: 0, fibonacci: 0.3 },
            5: { justIntonation: 0.5, harmonicSeries: 0.6, subharmonic: 0.6, goldenRatio: 0.2, fibonacci: 0.4 },
            6: { justIntonation: 0.5, harmonicSeries: 0.7, subharmonic: 0.5, goldenRatio: 0.3, fibonacci: 0.5 },
            7: { justIntonation: 0.5, harmonicSeries: 0.8, subharmonic: 0.5, goldenRatio: 0.4, fibonacci: 0.6 },
            8: { justIntonation: 0.5, harmonicSeries: 1.0, subharmonic: 0.5, goldenRatio: 0.5, fibonacci: 0.7 }
        };

        const config = layerConfig[level] || layerConfig[8];

        Object.entries(config).forEach(([layerName, amplitude]) => {
            if (this.layerGains[layerName]) {
                this.layerGains[layerName].gain.setTargetAtTime(
                    amplitude,
                    this.ctx.currentTime,
                    2 // 2 second fade
                );
            }
        });
    }

    setMasterVolume(volume) {
        if (this.droneGain) {
            this.droneGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
        }
    }
}

// Initialize the app
const app = new AmbientMusicGenerator();
