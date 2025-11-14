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

- **Oscillators**: Multiple sine wave oscillators with harmonic relationships
- **Noise Generators**: White noise filtered to create natural sound textures
- **Signal Chain**: Audio → Filters → Effects → Master Gain → Output

## Browser Compatibility

Requires a browser with Web Audio API support:
- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 12+

## Tips for Best Results

- Start with low volumes and gradually increase
- Combine tones with natural sounds for rich textures
- Use phasing subtly (0.1-2 Hz) for organic movement
- Layer multiple natural sounds at different levels
- Add reverb for spatial depth

## Local Development

Simply open `index.html` in your browser - no build process or server required!

For local server (optional):
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

## License

MIT License - Feel free to use and modify as needed.
