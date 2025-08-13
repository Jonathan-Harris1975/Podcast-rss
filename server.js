const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const RSS = require("rss");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Data storage configuration
const defaultDataDir = path.join(__dirname, "data");
const dataDir = process.env.DATA_DIR || defaultDataDir;
const dataFile = path.join(dataDir, "podcast-data.json");

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }
}

// Initialize data file
function initializeDataFile() {
  ensureDataDirectory();
  
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      rss: {
        title: "My Podcast",
        link: "https://example.com",
        language: "en-us",
        copyright: "© 2025 My Podcast",
        description: "A great podcast about interesting topics",
        itunes_author: "Podcast Author",
        itunes_explicit: "false",
        owner: {
          name: "Podcast Owner",
          email: "owner@example.com"
        },
        itunes_image: "https://example.com/podcast-image.jpg",
        categories: {
          primary: "Technology",
          secondary: "News"
        },
        last_build_date: new Date().toUTCString(),
        itunes_type: "episodic",
        itunes_keywords: "technology,news,podcast",
        funding: {
          url: "https://example.com/support",
          text: "Support this podcast"
        }
      },
      episodes: [],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
    console.log(`Initialized new podcast data file: ${dataFile}`);
  } else {
    console.log(`Using existing podcast data file: ${dataFile}`);
  }
}

// Load data with error handling
function loadData() {
  try {
    const rawData = fs.readFileSync(dataFile, "utf8");
    const data = JSON.parse(rawData);
    
    // Validate data structure
    if (!data.episodes || !Array.isArray(data.episodes)) {
      throw new Error("Invalid data structure: episodes array missing");
    }
    
    return data;
  } catch (error) {
    console.error(`Error loading data: ${error.message}`);
    return {
      rss: {
        title: "My Podcast",
        link: "https://example.com",
        language: "en-us",
        copyright: "© 2025 My Podcast",
        description: "A great podcast about interesting topics",
        itunes_author: "Podcast Author",
        itunes_explicit: "false",
        owner: {
          name: "Podcast Owner",
          email: "owner@example.com"
        },
        itunes_image: "https://example.com/podcast-image.jpg",
        categories: {
          primary: "Technology",
          secondary: "News"
        },
        last_build_date: new Date().toUTCString(),
        itunes_type: "episodic",
        itunes_keywords: "technology,news,podcast",
        funding: {
          url: "https://example.com/support",
          text: "Support this podcast"
        }
      },
      episodes: [],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      }
    };
  }
}

// Save data with backup and atomic write
function saveData(data) {
  try {
    // Create backup
    const backupFile = `${dataFile}.backup-${Date.now()}`;
    if (fs.existsSync(dataFile)) {
      fs.copyFileSync(dataFile, backupFile);
    }

    // Update metadata
    data.metadata = data.metadata || {};
    data.metadata.lastModified = new Date().toISOString();
    data.metadata.version = data.metadata.version || "1.0.0";

    // Atomic write
    const tempFile = `${dataFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, dataFile);

    return true;
  } catch (error) {
    console.error(`Error saving data: ${error.message}`);
    return false;
  }
}

// Generate podcast RSS feed
function generatePodcastRSSFeed() {
  try {
    const data = loadData();
    const publicDir = path.join(__dirname, "public");
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    const feed = new RSS({
      title: data.rss.title,
      description: data.rss.description,
      feed_url: `${data.rss.link}/feed.xml`,
      site_url: data.rss.link,
      language: data.rss.language,
      copyright: data.rss.copyright,
      pubDate: data.rss.last_build_date,
      generator: "Podcast RSS Generator",
      custom_namespaces: {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        'podcast': 'https://podcastindex.org/namespace/1.0'
      },
      custom_elements: [
        {'itunes:author': data.rss.itunes_author},
        {'itunes:explicit': data.rss.itunes_explicit},
        {'itunes:owner': [
          {'itunes:name': data.rss.owner.name},
          {'itunes:email': data.rss.owner.email}
        ]},
        {'itunes:image': {_attr: {href: data.rss.itunes_image}}},
        {'itunes:category': {_attr: {text: data.rss.categories.primary}}},
        {'itunes:type': data.rss.itunes_type},
        {'itunes:keywords': data.rss.itunes_keywords},
        {'podcast:funding': {_attr: {url: data.rss.funding.url}, _cdata: data.rss.funding.text}}
      ]
    });

    // Add episodes sorted by date (newest first)
    data.episodes
      .sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date))
      .forEach(episode => {
        const customElements = [
          {'itunes:subtitle': episode.subtitle || ''},
          {'itunes:keywords': episode.keywords || ''},
          {'itunes:season': episode.season || ''},
          {'itunes:episode': episode.episode_number || ''},
          {'itunes:episodeType': episode.episode_type || 'full'}
        ];

        if (episode.transcript && episode.transcript.url) {
          customElements.push({
            'podcast:transcript': {
              _attr: {
                url: episode.transcript.url,
                type: episode.transcript.type || 'text/plain'
              }
            }
          });
        }

        if (episode.chapters_url) {
          customElements.push({
            'podcast:chapters': {_attr: {url: episode.chapters_url, type: 'application/json+chapters'}}
          });
        }

        feed.item({
          title: episode.title,
          description: episode.description,
          url: episode.audio.url,
          guid: {
            value: episode.guid.value,
            isPermaLink: episode.guid.is_permalink === 'true'
          },
          date: episode.pub_date,
          enclosure: {
            url: episode.audio.url,
            type: episode.audio.type,
            size: episode.audio.length
          },
          custom_elements: customElements
        });
      });

    const xml = feed.xml({ indent: true });
    fs.writeFileSync(path.join(publicDir, "feed.xml"), xml);
    return true;
  } catch (error) {
    console.error(`Error generating podcast RSS feed: ${error.message}`);
    return false;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  const data = loadData();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    dataFile: dataFile,
    episodeCount: data.episodes.length,
    lastModified: data.metadata.lastModified,
    uptime: process.uptime()
  });
});

// Get RSS feed info
app.get("/api/rss", (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    rss: data.rss
  });
});

// Update RSS feed info
app.put("/api/rss", (req, res) => {
  const data = loadData();
  
  // Update RSS info with provided data
  data.rss = { ...data.rss, ...req.body };
  data.rss.last_build_date = new Date().toUTCString();
  
  if (saveData(data)) {
    generatePodcastRSSFeed();
    res.json({
      success: true,
      message: "RSS feed info updated successfully",
      rss: data.rss
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to update RSS feed info"
    });
  }
});

// Get all episodes
app.get("/api/episodes", (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    episodes: data.episodes.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date))
  });
});

// Add new episode
app.post("/api/episodes", (req, res) => {
  const episodeData = req.body;
  
  // Validation
  if (!episodeData.title || !episodeData.description || !episodeData.audio || !episodeData.audio.url) {
    return res.status(400).json({
      success: false,
      message: "Title, description, and audio URL are required"
    });
  }

  const data = loadData();
  
  // Check for duplicate GUID
  if (episodeData.guid && data.episodes.some(ep => ep.guid.value === episodeData.guid.value)) {
    return res.status(400).json({
      success: false,
      message: "An episode with this GUID already exists"
    });
  }

  const newEpisode = {
    title: episodeData.title,
    description: episodeData.description,
    pub_date: episodeData.pub_date || new Date().toUTCString(),
    audio: {
      url: episodeData.audio.url,
      type: episodeData.audio.type || "audio/mpeg",
      length: episodeData.audio.length || "0"
    },
    guid: {
      value: episodeData.guid?.value || uuidv4(),
      is_permalink: episodeData.guid?.is_permalink || "false"
    },
    season: episodeData.season || "",
    episode_number: episodeData.episode_number || "",
    episode_type: episodeData.episode_type || "full",
    transcript: episodeData.transcript || {},
    subtitle: episodeData.subtitle || "",
    keywords: episodeData.keywords || "",
    chapters_url: episodeData.chapters_url || "",
    links_json: episodeData.links_json || "",
    cta: episodeData.cta || {},
    utm: episodeData.utm || {},
    podcorn_ad: episodeData.podcorn_ad || ""
  };

  data.episodes.unshift(newEpisode);
  data.rss.last_build_date = new Date().toUTCString();
  
  if (saveData(data)) {
    generatePodcastRSSFeed();
    res.status(201).json({
      success: true,
      message: "Episode added successfully",
      episode: newEpisode
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to save episode"
    });
  }
});

// Get specific episode
app.get("/api/episodes/:guid", (req, res) => {
  const data = loadData();
  const episode = data.episodes.find(ep => ep.guid.value === req.params.guid);
  
  if (!episode) {
    return res.status(404).json({
      success: false,
      message: "Episode not found"
    });
  }
  
  res.json({
    success: true,
    episode: episode
  });
});

// Update episode
app.put("/api/episodes/:guid", (req, res) => {
  const data = loadData();
  const episodeIndex = data.episodes.findIndex(ep => ep.guid.value === req.params.guid);
  
  if (episodeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Episode not found"
    });
  }
  
  // Update episode with provided data
  data.episodes[episodeIndex] = { ...data.episodes[episodeIndex], ...req.body };
  data.rss.last_build_date = new Date().toUTCString();
  
  if (saveData(data)) {
    generatePodcastRSSFeed();
    res.json({
      success: true,
      message: "Episode updated successfully",
      episode: data.episodes[episodeIndex]
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to update episode"
    });
  }
});

// Delete episode
app.delete("/api/episodes/:guid", (req, res) => {
  const data = loadData();
  const episodeIndex = data.episodes.findIndex(ep => ep.guid.value === req.params.guid);
  
  if (episodeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Episode not found"
    });
  }
  
  const deletedEpisode = data.episodes.splice(episodeIndex, 1)[0];
  data.rss.last_build_date = new Date().toUTCString();
  
  if (saveData(data)) {
    generatePodcastRSSFeed();
    res.json({
      success: true,
      message: "Episode deleted successfully",
      episode: deletedEpisode
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to delete episode"
    });
  }
});

// Serve RSS feed
app.get("/feed.xml", (req, res) => {
  const feedPath = path.join(__dirname, "public", "feed.xml");
  if (fs.existsSync(feedPath)) {
    res.set('Content-Type', 'application/rss+xml');
    res.sendFile(feedPath);
  } else {
    res.status(404).json({
      success: false,
      message: "RSS feed not found"
    });
  }
});

// API documentation endpoint
app.get("/api-docs", (req, res) => {
  res.json({
    title: "Podcast RSS Feed API",
    version: "1.0.0",
    endpoints: {
      "GET /health": "Health check",
      "GET /api/rss": "Get RSS feed information",
      "PUT /api/rss": "Update RSS feed information",
      "GET /api/episodes": "Get all episodes",
      "POST /api/episodes": "Add new episode",
      "GET /api/episodes/:guid": "Get specific episode",
      "PUT /api/episodes/:guid": "Update episode",
      "DELETE /api/episodes/:guid": "Delete episode",
      "GET /feed.xml": "Get RSS feed XML"
    },
    example_payload: {
      rss: {
        title: "My Podcast",
        link: "https://example.com",
        language: "en-us",
        copyright: "© 2025 My Podcast",
        description: "A great podcast about interesting topics",
        itunes_author: "Podcast Author",
        itunes_explicit: "false",
        owner: {
          name: "Podcast Owner",
          email: "owner@example.com"
        },
        itunes_image: "https://example.com/podcast-image.jpg",
        categories: {
          primary: "Technology",
          secondary: "News"
        },
        itunes_type: "episodic",
        itunes_keywords: "technology,news,podcast",
        funding: {
          url: "https://example.com/support",
          text: "Support this podcast"
        }
      },
      episode: {
        title: "Episode Title",
        description: "Episode description",
        pub_date: "Wed, 13 Aug 2025 12:00:00 GMT",
        audio: {
          url: "https://example.com/episode.mp3",
          type: "audio/mpeg",
          length: "12345678"
        },
        guid: {
          value: "unique-episode-id",
          is_permalink: "false"
        },
        season: "1",
        episode_number: "1",
        episode_type: "full",
        transcript: {
          url: "https://example.com/transcript.txt",
          type: "text/plain"
        },
        subtitle: "Episode subtitle",
        keywords: "keyword1,keyword2",
        chapters_url: "https://example.com/chapters.json",
        links_json: "https://example.com/links.json",
        cta: {
          text: "Visit our website",
          url: "https://example.com"
        },
        utm: {
          source: "podcast",
          medium: "audio",
          campaign: "episode1"
        },
        podcorn_ad: "ad_content_here"
      }
    }
  });
});

// Initialize on startup
initializeDataFile();
generatePodcastRSSFeed();

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Podcast RSS server running on port ${PORT}`);
  console.log(`RSS feed: http://localhost:${PORT}/feed.xml`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
});

