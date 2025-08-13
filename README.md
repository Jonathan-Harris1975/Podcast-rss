# Podcast RSS Generator

A Node.js application for generating and managing podcast RSS feeds with full iTunes podcast support.

## Features

- Generate podcast RSS feeds with iTunes-specific tags
- RESTful API for managing podcast episodes
- Persistent data storage with automatic backups
- Docker support for easy deployment
- Render.com deployment configuration with persistent disk
- Full podcast namespace support including transcripts, chapters, and funding

## JSON Payload Structure

The application accepts podcast data in the following JSON structure:

### RSS Feed Information
```json
{
  "rss": {
    "title": "My Podcast",
    "link": "https://example.com",
    "language": "en-us",
    "copyright": "© 2025 My Podcast",
    "description": "A great podcast about interesting topics",
    "itunes_author": "Podcast Author",
    "itunes_explicit": "false",
    "owner": {
      "name": "Podcast Owner",
      "email": "owner@example.com"
    },
    "itunes_image": "https://example.com/podcast-image.jpg",
    "categories": {
      "primary": "Technology",
      "secondary": "News"
    },
    "last_build_date": "Wed, 13 Aug 2025 12:00:00 GMT",
    "itunes_type": "episodic",
    "itunes_keywords": "technology,news,podcast",
    "funding": {
      "url": "https://example.com/support",
      "text": "Support this podcast"
    }
  }
}
```

### Episode Information
```json
{
  "episode": {
    "title": "Episode Title",
    "description": "Episode description",
    "pub_date": "Wed, 13 Aug 2025 12:00:00 GMT",
    "audio": {
      "url": "https://example.com/episode.mp3",
      "type": "audio/mpeg",
      "length": "12345678"
    },
    "guid": {
      "value": "unique-episode-id",
      "is_permalink": "false"
    },
    "season": "1",
    "episode_number": "1",
    "episode_type": "full",
    "transcript": {
      "url": "https://example.com/transcript.txt",
      "type": "text/plain"
    },
    "subtitle": "Episode subtitle",
    "keywords": "keyword1,keyword2",
    "chapters_url": "https://example.com/chapters.json",
    "links_json": "https://example.com/links.json",
    "cta": {
      "text": "Visit our website",
      "url": "https://example.com"
    },
    "utm": {
      "source": "podcast",
      "medium": "audio",
      "campaign": "episode1"
    },
    "podcorn_ad": "ad_content_here"
  }
}
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/rss` - Get RSS feed information
- `PUT /api/rss` - Update RSS feed information
- `GET /api/episodes` - Get all episodes
- `POST /api/episodes` - Add new episode
- `GET /api/episodes/:guid` - Get specific episode
- `PUT /api/episodes/:guid` - Update episode
- `DELETE /api/episodes/:guid` - Delete episode
- `GET /feed.xml` - Get RSS feed XML
- `GET /api-docs` - API documentation

## Installation

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

### Docker

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Render.com Deployment

1. Connect your repository to Render.com
2. The `render.yaml` file is configured for automatic deployment with persistent disk storage
3. The persistent disk will be mounted at `/opt/render/project/src/data` for data storage

## Data Storage

- Podcast data is stored in JSON format in the `data/` directory
- Automatic backups are created on each save
- The RSS feed XML is generated in the `public/` directory

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DATA_DIR` - Data storage directory (default: ./data)
- `NODE_ENV` - Environment (development/production)

## Usage Examples

### Adding a New Episode

```bash
curl -X POST http://localhost:3000/api/episodes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Episode",
    "description": "This is my first podcast episode",
    "audio": {
      "url": "https://example.com/episode1.mp3",
      "type": "audio/mpeg",
      "length": "12345678"
    },
    "season": "1",
    "episode_number": "1"
  }'
```

### Updating RSS Feed Information

```bash
curl -X PUT http://localhost:3000/api/rss \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Updated Podcast Title",
    "description": "Updated podcast description"
  }'
```

## License

MIT License

