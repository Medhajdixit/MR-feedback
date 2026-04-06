# AI Services - CampusFeedback+ 2.0

AI-powered content moderation and analysis services using NLP and ML models.

## Features

- 🤖 Toxicity Detection (BERT-based)
- 😊 Sentiment Analysis (DistilBERT)
- ✅ Constructiveness Scoring
- 🔒 PII Scrubbing & Privacy Protection
- 🖼️ Image Verification
- 📊 Text Enhancement Suggestions
- 🎯 Spam Detection
- 📈 Category Classification

## Tech Stack

- **Framework**: Flask
- **NLP**: Transformers (BERT, DistilBERT)
- **NER**: spaCy
- **ML**: scikit-learn, PyTorch
- **Image**: Pillow

## Project Structure

```
ai-services/
├── api/
│   └── app.py              # Flask API
├── moderation/
│   ├── text_analyzer.py    # Text analysis
│   ├── decision_engine.py  # Moderation decisions
│   └── enhancement_service.py # Suggestions
├── privacy/
│   └── identity_scrubber.py # PII removal
├── analytics/
│   ├── image_verifier.py   # Image verification
│   └── trend_analyzer.py   # Trend detection
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container config
└── .env.example           # Environment template
```

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

## Running

```bash
# Development
python api/app.py

# Production with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

## API Endpoints

### POST /api/moderate
Moderate content with AI analysis

**Request:**
```json
{
  "content": "Text to moderate",
  "contentType": "feedback",
  "author": "0x..."
}
```

**Response:**
```json
{
  "decision": "APPROVE",
  "reason": "High quality constructive feedback",
  "scores": {
    "toxicity": 0.05,
    "sentiment": 0.85,
    "constructiveness": 85,
    "spam": 0.1
  },
  "qualityBonus": 25,
  "suggestions": []
}
```

### POST /api/scrub-privacy
Remove PII from content

### POST /api/verify-image
Verify image authenticity

### POST /api/enhance-feedback
Get enhancement suggestions

### POST /api/analyze-text
Detailed text analysis

### POST /api/batch-moderate
Batch moderation

## Models Used

1. **Toxicity Detection**: `unitary/toxic-bert`
2. **Sentiment Analysis**: `distilbert-base-uncased-finetuned-sst-2-english`
3. **NER (PII)**: `en_core_web_sm` (spaCy)
4. **Spam Detection**: Rule-based + patterns

## Configuration

See `.env.example` for all configuration options.

## Docker

```bash
# Build
docker build -t campusfeedback-ai .

# Run
docker run -p 5000:5000 campusfeedback-ai
```

## License

MIT
