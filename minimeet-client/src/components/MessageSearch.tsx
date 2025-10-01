import React, { useState } from "react";
import { apiClient } from "../services/api";
import "../style/MessageSearch.css";

interface MessageSearchProps {
  roomId?: string;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

interface SearchResult {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  senderEmail: string;
  roomId: string;
  timestamp: string;
  highlights?: {
    content?: string[];
  };
  score: number;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  roomId,
  onLog,
  onError,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      onError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    try {
      onLog(`Searching for: "${query}"`);
      const response = await apiClient.searchMessages(query, roomId);
      setResults(response.results);
      setShowResults(true);
      onLog(`Found ${response.resultCount} results`);
    } catch (error: any) {
      onError(`Search failed: ${error.message}`);
      onLog(`Search error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="message-search">
      <div className="search-input-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search messages..."
          className="search-input"
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="search-button"
        >
          {isSearching ? "Searching..." : "🔍 Search"}
        </button>
        {(showResults || query) && (
          <button onClick={handleClear} className="clear-button">
            ✕ Clear
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results">
          <div className="results-header">
            <h4>
              Search Results ({results.length})
              {roomId && <span className="room-badge">This room only</span>}
            </h4>
          </div>

          {results.length === 0 ? (
            <div className="no-results">
              <p>No messages found for "{query}"</p>
              <p className="hint">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="results-list">
              {results.map((result) => (
                <div key={result.id} className="search-result-item">
                  <div className="result-header">
                    <strong className="result-sender">
                      {result.senderUsername}
                    </strong>
                    <span className="result-time">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="result-content"
                    dangerouslySetInnerHTML={{
                      __html:
                        result.highlights?.content?.[0] || result.content,
                    }}
                  />
                  <div className="result-footer">
                    <span className="result-score">
                      Relevance: {Math.round(result.score * 100)}%
                    </span>
                    {!roomId && (
                      <span className="result-room">
                        Room: {result.roomId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
