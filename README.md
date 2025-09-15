# Trust of Copilot - My Partner

> Lời thú tội của cộng sự đáng kính (Confession of a Respectable Partner)

A simple, transparent AI partner system focused on building trust through clear communication and collaborative interaction.

## Overview

This project implements an AI partner that emphasizes:
- **Transparency**: Clear communication about confidence levels and limitations
- **Trust Building**: Gradual trust development through consistent interactions
- **Partnership**: Collaborative rather than directive relationship model
- **Simplicity**: Easy to understand and extend codebase

## Features

- Interactive AI partner with personality customization
- Confidence scoring and transparency indicators
- Trust score tracking over time
- Interaction history persistence
- Configurable capabilities and responses
- CLI interface for direct interaction

## Quick Start

1. **Run the basic partner interface:**
   ```bash
   python partner.py
   ```

2. **Try the demonstration:**
   ```bash
   python example.py
   ```

3. **View your trust report:**
   Type `trust` in the interactive mode to see current trust metrics.

## Core Components

### AIPartner Class
The main partner implementation with features:
- Configurable personality types (helpful, analytical, creative)
- Confidence-based response generation
- Trust score calculation
- Interaction history tracking

### Configuration
Customize partner behavior through `config.json`:
- Default personality settings
- Confidence thresholds
- Capability toggles
- Trust adjustment parameters

### Example Usage
```python
from partner import AIPartner

# Create your AI partner
partner = AIPartner("My Partner", "helpful")

# Interact with transparency
response = partner.respond("Help me with a task")
print(response)  # Includes confidence indicators

# Check trust development
trust_report = partner.get_trust_report()
print(f"Trust score: {trust_report['trust_score']}")
```

## Trust Model

The trust system works by:
1. Starting with a neutral trust score (0.5)
2. Adjusting based on interaction confidence levels
3. Providing transparency about uncertainty
4. Building trust through consistent, honest communication

## Partnership Philosophy

This AI partner is designed to work **with** you, not just **for** you:
- Admits uncertainty rather than guessing
- Provides confidence levels for all responses
- Encourages collaborative problem-solving
- Maintains interaction history for relationship building

## Files

- `partner.py` - Main AI partner implementation
- `example.py` - Demonstration and example usage
- `config.json` - Configuration settings
- `requirements.txt` - Python dependencies (minimal)

## Contributing

This is a simple, educational implementation focused on trust and transparency in AI partnerships. Feel free to extend and improve the trust model, add new personality types, or enhance the interaction capabilities.

## License

See LICENSE file for details.
