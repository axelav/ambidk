# Ambient Music Generator

A browser-based ambient music generator that creates soundscapes using the Web Audio API. Generate soothing tones and natural sounds entirely in your browser.

## Features

### Tone Generation
- **Root Note**: Adjust the base frequency (220-880 Hz, A3-A5)
- **Frequency Multiplier**: Scale all frequencies (0.5x-4x)
- **Phasing**: Add subtle frequency modulation for organic movement
- **Harmonics**: Layer multiple harmonic overtones (1-8 harmonics)
- **Tone Volume**: Control the overall volume of generated tones

### Natural Sounds
Generate realistic natural ambient sounds:
- **Rain**: Sporadic high-frequency noise simulating rainfall
- **Water Flow**: Smooth flowing noise like a stream or waterfall
- **Static**: Pure white noise for textured atmosphere
- **Metallic Hum**: 60Hz hum with harmonics for industrial ambience
- **Wind**: Low-frequency rumble simulating wind

### Effects
- **Reverb**: Add spatial depth to the soundscape
- **Delay**: Create echoing, spacious effects

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Click the **Start** button to begin audio generation
3. Adjust sliders in real-time to shape your soundscape
4. Click **Stop** to end the session

## Technical Details

- Built with vanilla JavaScript and the Web Audio API
- All sounds generated in real-time (no samples required)
- Responsive design works on desktop and mobile
- No external dependencies

## Audio Architecture

### Complex Microtonal Drone Engine

The application uses a sophisticated multi-layer synthesis system with 80+ simultaneous oscillators:

**Synthesis Layers:**
- **Just Intonation Layer**: 8 voices using pure intervals (1:1, 9:8, 5:4, 4:3, 3:2, 5:3, 15:8, 2:1)
- **Harmonic Series Layer**: 9 voices following the natural harmonic series (1, 2, 3, 4, 5, 7, 9, 11, 13)
- **Subharmonic Layer**: 4 voices below the root frequency for deep bass presence
- **Golden Ratio Layer**: 6 voices using φ (1.618...) and its derivatives for irrational intervals
- **Fibonacci Layer**: 5 voices using Fibonacci sequence ratios (2:3, 3:5, 5:8, 8:13, 13:21)

**Advanced Features:**
- **Chorus/Detuning**: Each voice consists of 2-3 detuned oscillators (±2-5 cents) creating slow beating
- **FM Synthesis**: Three FM pairs modulate carrier frequencies for warmth and metallic character
- **Ultra-slow LFOs**: 20-60 second modulation cycles creating subtle breathing effects
- **Dynamic Evolution**: Drone slowly evolves every 30-60 seconds with random parameter variations
- **Octave Spreading**: Strategic octave placement for thick, orchestral texture

**Signal Chain:**
Oscillators → FM Modulation → Layer Gains → Effects (Reverb/Delay) → Master Gain → Output

**Total Oscillator Count:** ~89 OscillatorNodes (including LFOs and FM modulators)

## Browser Compatibility

Requires a browser with Web Audio API support:
- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 12+

## Tips for Best Results

- **Start with complexity level 3-4** and adjust from there
- **Set tone volume to 20-40%** to avoid overwhelming the mix
- **Use phasing subtly (0.5-3 Hz)** for gentle warbling and chorus effects
- **Combine the microtonal drone with natural sounds** for incredibly rich textures
- **Let it evolve**: The drone changes character every 30-60 seconds automatically
- **Lower root notes (220-330 Hz)** create deeper, more meditative drones
- **Higher harmonics (6-8)** activate all synthesis layers for maximum complexity
- **Add reverb (50-70%)** for spatial depth and to blend the layers

## Local Development

Simply open `index.html` in your browser - no build process or server required!

For local server (optional):
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

## License

MIT License - Feel free to use and modify as needed.
