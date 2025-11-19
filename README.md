# The Tribe FAQ Agent

An AI-powered FAQ chatbot for The Tribe company website, built with LangChain and OpenAI. Visitors can ask questions about the company, employees, mission, and services, and receive accurate answers based on company data.

## Features

- 🤖 **AI-Powered Responses**: Uses OpenAI's language models to answer questions naturally
- 🔍 **Dynamic Context Retrieval**: Implements RAG (Retrieval Augmented Generation) to only use relevant context
- 🌐 **Web Interface**: HTMX-powered frontend for seamless user experience
- 📡 **REST API**: JSON API endpoints for integration with other applications
- 💾 **Token Efficient**: Only sends relevant context to the LLM, reducing costs
- 🎯 **Multiple Implementations**: Choose between full context or RAG-based approaches

## Tech Stack

- **Backend**: Node.js, Express
- **AI Framework**: LangChain v1.0.4
- **LLM Provider**: OpenAI (ChatGPT)
- **Frontend**: HTMX, vanilla JavaScript
- **Data Format**: JSON (FAQ data)

## Project Structure

```
the-tribe-agent/
├── agent.js                 # Full context agent (loads all FAQ data)
├── agent-simple-rag.js      # Simple RAG with keyword search (default)
├── agent-with-rag.js        # RAG with vector embeddings (requires setup)
├── agent-rag-example.js     # Example implementations for RAG patterns
├── server.js                # Express web server with API endpoints
├── index.html               # HTMX-powered web interface
├── example.html             # Alternative vanilla JS example
├── faq.json                 # Company FAQ data (employees, mission, etc.)
├── test-rag.js              # Test script for RAG implementation
├── RAG-EXPLANATION.md       # Guide to RAG and dynamic context building
└── SETUP-RAG.md             # Setup guide for vector store options
```

## Quick Start

### Prerequisites

- Node.js 20+
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd the-tribe-agent
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   OPEN_API_KEY=your_openai_api_key_here
   PORT=3000
   ```

4. **Start the server**

   ```bash
   npm start
   ```

5. **Open your browser**

   Navigate to `http://localhost:3000` to use the web interface.

## Usage

### Web Interface

Start the server and open `http://localhost:3000` in your browser. The HTMX interface allows you to:

- Type questions in the input box
- Click "Send" or press Enter
- View answers in a chat-like interface

### CLI Mode

Run the agent directly from the command line:

```bash
npm run cli "Who works at this company?"
```

### API Endpoints

#### POST `/api/ask`

Ask a question via JSON API.

**Request:**

```json
{
  "question": "What is the company's mission?"
}
```

**Response:**

```json
{
  "question": "What is the company's mission?",
  "answer": "The Tribe's mission is to offer top developers..."
}
```

#### POST `/ask`

HTMX endpoint for form submissions. Returns HTML fragments.

#### GET `/api/ask?q=question`

Ask a question via URL parameter.

**Example:**

```
GET /api/ask?q=Who%20works%20at%20this%20company?
```

#### GET `/health`

Health check endpoint.

## Agent Implementations

The project includes three different agent implementations:

### 1. `agent.js` - Full Context

- Loads all FAQ data into the prompt
- Simple, no retrieval needed
- Best for: Small datasets (< 50 items)
- **Usage**: Change import in `server.js` to `"./agent.js"`

### 2. `agent-simple-rag.js` - Keyword-Based RAG (Default)

- Uses keyword matching to find relevant context
- Only sends top 5 relevant documents to LLM
- No additional dependencies required
- Best for: Medium datasets, getting started
- **Usage**: Currently default in `server.js`

### 3. `agent-with-rag.js` - Vector Embeddings RAG

- Uses semantic search with vector embeddings
- Most accurate retrieval
- Requires vector store setup
- Best for: Large datasets, production use
- **Usage**: Requires `@langchain/community` package

See `RAG-EXPLANATION.md` and `SETUP-RAG.md` for detailed information.

## Configuration

### Switching Agent Implementations

Edit `server.js` and change the import:

```javascript
// Full context (loads everything)
import { runFAQAgent } from "./agent.js";

// Simple RAG with keywords (default)
import { runFAQAgent } from "./agent-simple-rag.js";

// RAG with vector embeddings
import { runFAQAgent } from "./agent-with-rag.js";
```

### Environment Variables

- `OPEN_API_KEY` - Your OpenAI API key (required)
- `PORT` - Server port (default: 3000)

## FAQ Data Structure

The `faq.json` file contains company information:

- **Company Info**: Name, founder, co-founders, tagline, story
- **Employees**: Name, role, area of expertise
- **Mission Areas**: Frontend, Backend, Mobile, AI & Data, etc.
- **Contact Information**: Email, phone, address
- **Careers**: Open roles, culture, values

The data supports both English (`en`) and Swedish (`sv`) languages.

## Development

### Running Tests

Test the RAG implementation:

```bash
npm run test-rag
```

### Adding New FAQ Data

Edit `faq.json` to add or update company information. The agents will automatically use the updated data.

### Customizing the System Prompt

Edit the `systemPrompt` variable in the agent files to customize how the AI responds.

## Production Deployment

### Considerations

1. **Vector Store**: For production with large datasets, consider using:

   - Chroma (simple, local)
   - Pinecone (managed, scalable)
   - PostgreSQL with pgvector (if you use PostgreSQL)

2. **Caching**: Implement caching for common questions to reduce API costs

3. **Rate Limiting**: Add rate limiting to prevent abuse

4. **Monitoring**: Monitor token usage and API costs

5. **Error Handling**: Ensure graceful error handling for API failures

### Deployment Platforms

This project can be deployed on:

- Heroku
- Railway
- Render
- Vercel (serverless)
- Any Node.js hosting platform

Make sure to set the `OPEN_API_KEY` environment variable in your hosting platform.

## Cost Considerations

- **Embeddings**: One-time cost when indexing documents (if using vector RAG)
- **LLM Calls**: Pay per token used
- **Simple RAG**: Reduces token usage by 60-70% compared to full context
- **Caching**: Implement caching to reduce repeated API calls

## Troubleshooting

### "Cannot find module" errors

- Ensure all dependencies are installed: `npm install`
- Check Node.js version (requires 20+)

### API key errors

- Verify `.env` file exists and contains `OPEN_API_KEY`
- Check that the API key is valid and has credits

### Vector store errors

- If using `agent-with-rag.js`, ensure vector store packages are installed
- Consider using `agent-simple-rag.js` for simpler setup

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For questions or issues, please open an issue on the repository.
