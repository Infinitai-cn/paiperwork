package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"
)

func noCacheHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		h.ServeHTTP(w, r)
	})
}

func proxyVersionCheck(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers first - this ensures they're sent even if there's an error
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Log the request with a timestamp
	log.Printf("[%s] Version check request received", time.Now().Format(time.RFC3339))

	// Raw GitHub content URL - this is the correct format for accessing raw files
	cacheBuster := fmt.Sprintf("nocache=%d-%d", time.Now().UnixNano(), rand.Int63())
	versionUrl := fmt.Sprintf("https://raw.githubusercontent.com/Infinitai-cn/paiperwork/main/version.json?%s", cacheBuster)

	// Create an HTTP client with timeouts
	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			DisableKeepAlives:   true, // Don't reuse connections
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}

	// Create a new request
	req, err := http.NewRequest("GET", versionUrl, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Add appropriate headers to make the request more reliable
	req.Header.Set("User-Agent", "Paiperwork-UpdateChecker/1.0")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Cache-Control", "no-cache")

	// Execute the request with detailed logging
	log.Printf("Fetching from GitHub: %s", versionUrl)
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching version data: %v", err)

		// Provide a user-friendly error
		errorMsg := "Could not connect to update server. Please check your internet connection."
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		fmt.Fprintf(w, `{"error":"%s"}`, errorMsg)
		return
	}
	defer resp.Body.Close()

	// Log response status
	log.Printf("GitHub response status: %d %s", resp.StatusCode, resp.Status)

	// Handle non-200 responses
	if resp.StatusCode != http.StatusOK {
		log.Printf("GitHub returned status %d", resp.StatusCode)
		w.WriteHeader(resp.StatusCode)
		fmt.Fprintf(w, `{"error":"Update server returned %s"}`, resp.Status)
		return
	}

	// Read body with size limit (prevent abuse)
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Error reading version data", http.StatusInternalServerError)
		return
	}

	// Log successful response
	log.Printf("Successfully retrieved version data (%d bytes)", len(body))

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Write the response body to our client
	w.Write(body)
}

func proxyOllamaLibrary(w http.ResponseWriter, r *http.Request) {
	// Get the full path including model name if present
	path := r.URL.Path
	// Remove /api prefix when forwarding to ollama.com
	targetURL := "https://ollama.com" + strings.TrimPrefix(path, "/api")

	log.Printf("Proxying request from %s to: %s", path, targetURL)

	resp, err := http.Get(targetURL)
	if err != nil {
		log.Printf("Error fetching from Ollama: %v", err)
		http.Error(w, "Failed to fetch from Ollama", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	io.Copy(w, resp.Body)
}
func proxyBingSearch(w http.ResponseWriter, r *http.Request) {
	// Extract query parameter from request
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter", http.StatusBadRequest)
		return
	}

	// Get the mode (document+websearch or regular)
	mode := r.URL.Query().Get("mode")
	isDocumentSearch := mode == "doc"

	// Log the incoming request details
	log.Printf("Search request received - Query: %q, Mode: %s", query, mode)

	// Detect user's preferred language from the incoming request's Accept-Language header
	acceptLang := r.Header.Get("Accept-Language")
	if acceptLang == "" {
		acceptLang = "en-US"
	}

	// Extract primary language tag (e.g. "en-US" or "fr")
	primary := strings.SplitN(acceptLang, ",", 2)[0]
	primary = strings.TrimSpace(strings.SplitN(primary, ";", 2)[0])

	// Derive setlang (language) and setmkt (market/locale)
	setlang := "en"
	setmkt := "en-US"
	if primary != "" {
		parts := strings.SplitN(primary, "-", 2)
		setlang = parts[0]
		if len(parts) == 2 {
			setmkt = primary
		} else {
			// Map common language codes to reasonable default markets
			switch setlang {
			case "en":
				setmkt = "en-US"
			case "fr":
				setmkt = "fr-FR"
			case "de":
				setmkt = "de-DE"
			case "es":
				setmkt = "es-ES"
			case "pt":
				setmkt = "pt-BR"
			case "zh":
				setmkt = "zh-CN"
			case "ja":
				setmkt = "ja-JP"
			default:
				// Fallback: append US as region
				setmkt = setlang + "-US"
			}
		}
	}

	// Sanitize the query: trim, remove surrounding quotes/parentheses/brackets, collapse whitespace
	cleanQ := strings.TrimSpace(query)
	// Remove surrounding matching quotes
	if (strings.HasPrefix(cleanQ, "\"") && strings.HasSuffix(cleanQ, "\"")) || (strings.HasPrefix(cleanQ, "'") && strings.HasSuffix(cleanQ, "'")) {
		cleanQ = cleanQ[1:len(cleanQ)-1]
	}
	// Remove surrounding parentheses/brackets
	if (strings.HasPrefix(cleanQ, "(") && strings.HasSuffix(cleanQ, ")")) || (strings.HasPrefix(cleanQ, "[") && strings.HasSuffix(cleanQ, "]")) {
		cleanQ = cleanQ[1:len(cleanQ)-1]
	}
	// Collapse multiple whitespace into single spaces
	cleanQ = regexp.MustCompile(`\s+`).ReplaceAllString(cleanQ, " ")

	// Build a minimal Bing URL: only q plus detected market/language
	bingURL := "https://www.bing.com/search?q=" + url.QueryEscape(cleanQ) + "&setmkt=" + url.QueryEscape(setmkt) + "&setlang=" + url.QueryEscape(setlang)

	// Log detected language and chosen parameters for debugging
	log.Printf("Accept-Language: %q -> setmkt=%s setlang=%s", acceptLang, setmkt, setlang)

	// Log what URL we're building
	log.Printf("Built Bing URL: %s", bingURL)

	// Create a client with redirect handling
	client := &http.Client{
		Timeout: 15 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Copy headers on redirect
			for key, values := range via[0].Header {
				for _, value := range values {
					req.Header.Add(key, value)
				}
			}
			return nil
		},
	}

	// Create a new request for Bing
	req, err := http.NewRequest("GET", bingURL, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Use a more diverse set of headers to appear like a regular browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://www.bing.com/")
	req.Header.Set("sec-ch-ua", `"Chromium";v="122", "Google Chrome";v="122", "Not:A-Brand";v="99"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", "\"Windows\"")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Upgrade-Insecure-Requests", "1")

	// IMPORTANT: Don't send the hardcoded cookie that might be causing the issue
	// Instead, use only what's necessary for getting English results
	req.Header.Set("Cookie", "MUID="+fmt.Sprintf("%x", time.Now().UnixNano()))

	// Log the full request for debugging
	if isDocumentSearch {
		log.Printf("Document+WebSearch request headers: %v", req.Header)
	}

	// Fetch the response
	log.Printf("Sending request to Bing...")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching from Bing: %v", err)
		http.Error(w, "Failed to fetch from Bing", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("Received response from Bing: status=%d, content-type=%s",
		resp.StatusCode, resp.Header.Get("Content-Type"))

	// Read the body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Failed to read response body", http.StatusInternalServerError)
		return
	}

	// Convert to string for processing
	htmlBody := string(body)

	// Add basic diagnostic info to help debug search issues
	hasSearchResults := strings.Contains(htmlBody, "b_algo")
	log.Printf("Response contains search results (b_algo): %v", hasSearchResults)

	// Add useful headers
	log.Printf("Response size: %d bytes", len(htmlBody))

	// Do some basic analysis of the HTML to help with debugging
	if !hasSearchResults {
		log.Printf("WARNING: Response doesn't contain expected search results markers")
		// Try to detect common blocking patterns
		if strings.Contains(htmlBody, "captcha") {
			log.Printf("BLOCKED: Response appears to contain a CAPTCHA challenge")
		}
		if strings.Contains(htmlBody, "unusual traffic") {
			log.Printf("BLOCKED: Bing reports unusual traffic from this computer")
		}
	} else {
		// Count how many search results we found
		resultCount := strings.Count(htmlBody, `class="b_algo"`)
		log.Printf("Found approximately %d search results in the response", resultCount)
	}

	// Fix relative URLs in the HTML to prevent them from resolving to localhost
	htmlBody = strings.ReplaceAll(htmlBody, "href=\"/", "href=\"https://www.bing.com/")
	htmlBody = strings.ReplaceAll(htmlBody, "src=\"/", "src=\"https://www.bing.com/")

	// Set response headers
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(resp.StatusCode)

	// Return the modified HTML
	w.Write([]byte(htmlBody))
}

// Add this new function
func fetchRawHtmlForLinks(w http.ResponseWriter, r *http.Request) {
	// Get URL parameter
	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	log.Printf("Raw HTML extraction request for URL: %s", targetURL)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Add browser-like headers
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	// Fetch the page
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching URL: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch URL: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read body with size limit (5MB)
	limitedReader := io.LimitReader(resp.Body, 5*1024*1024)
	body, err := io.ReadAll(limitedReader)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Failed to read page content", http.StatusInternalServerError)
		return
	}

	// Return the raw HTML with minimal processing (just fix relative URLs)
	htmlContent := string(body)

	// Fix relative URLs
	baseURL, err := url.Parse(targetURL)
	if err == nil {
		// Fix relative links to absolute
		htmlContent = regexp.MustCompile(`href="/(.*?)"`).ReplaceAllStringFunc(htmlContent, func(m string) string {
			link := regexp.MustCompile(`href="/(.*?)"`).FindStringSubmatch(m)[1]
			return fmt.Sprintf(`href="%s/%s"`, baseURL.Scheme+"://"+baseURL.Host, link)
		})
	}

	// Return the content as JSON
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	response := map[string]interface{}{
		"url":         targetURL,
		"rawHtml":     htmlContent,
		"extractedAt": time.Now().Format(time.RFC3339),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// Add after the proxyBingSearch function

// GET returns the raw contents of dev/app/core/js/utils/thinkingmodels.js
// POST accepts JSON { "content": "...js file contents..." } and safely writes the file
func thinkingModelsGetHandler(w http.ResponseWriter, r *http.Request) {
	// Restrict to GET only
	if r.Method != "GET" && r.Method != "OPTIONS" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	path := filepath.Join("app", "core", "js", "utils", "thinkingmodels.js")
	// Determine executable directory to build absolute path
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, path)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		log.Printf("Error reading thinkingmodels.js: %v", err)
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func thinkingModelsPostHandler(w http.ResponseWriter, r *http.Request) {
	// Accept POST with JSON body
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Basic CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")

	type reqBody struct {
		Content string `json:"content"`
	}

	var body reqBody
	dec := json.NewDecoder(io.LimitReader(r.Body, 5*1024*1024))
	if err := dec.Decode(&body); err != nil {
		log.Printf("Invalid request body for thinkingmodels POST: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Minimal validation: ensure content contains 'window.THINKING_MODELS' assignment
	if !strings.Contains(body.Content, "window.THINKING_MODELS") {
		http.Error(w, "Content validation failed", http.StatusBadRequest)
		return
	}

	// Build paths
	relPath := filepath.Join("app", "core", "js", "utils", "thinkingmodels.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, relPath)

	// Make a backup of the existing file
	backupPath := fullPath + ".bak"
	if _, err := os.Stat(fullPath); err == nil {
		// Copy file to backup (overwrite existing backup)
		input, err := os.ReadFile(fullPath)
		if err == nil {
			_ = os.WriteFile(backupPath, input, 0644)
		}
	}

	// Write new content atomically: write to temp file then rename
	dir := filepath.Dir(fullPath)
	tmpFile, err := os.CreateTemp(dir, "thinkingmodels-*.js")
	if err != nil {
		log.Printf("Failed to create temp file for thinkingmodels write: %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpPath := tmpFile.Name()
	if _, err := tmpFile.WriteString(body.Content); err != nil {
		log.Printf("Failed to write temp thinkingmodels file: %v", err)
		tmpFile.Close()
		os.Remove(tmpPath)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Rename temp file into place
	if err := os.Rename(tmpPath, fullPath); err != nil {
		log.Printf("Failed to replace thinkingmodels.js: %v", err)
		os.Remove(tmpPath)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"ok":true}`)
}

// GET/POST handlers for visualmodels.js
func visualModelsGetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "OPTIONS" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	rel := filepath.Join("app", "core", "js", "utils", "visualmodels.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, rel)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		log.Printf("Error reading visualmodels.js: %v", err)
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func visualModelsPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")

	type reqBody struct {
		Content string `json:"content"`
	}
	var body reqBody
	dec := json.NewDecoder(io.LimitReader(r.Body, 5*1024*1024))
	if err := dec.Decode(&body); err != nil {
		log.Printf("Invalid request body for visualmodels POST: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation: ensure content mentions 'window.' to reduce accidental deletion
	if !strings.Contains(body.Content, "window.") {
		http.Error(w, "Content validation failed", http.StatusBadRequest)
		return
	}

	rel := filepath.Join("app", "core", "js", "utils", "visualmodels.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, rel)

	// Backup
	backupPath := fullPath + ".bak"
	if _, err := os.Stat(fullPath); err == nil {
		input, err := os.ReadFile(fullPath)
		if err == nil {
			_ = os.WriteFile(backupPath, input, 0644)
		}
	}

	// Atomic write
	dir := filepath.Dir(fullPath)
	tmpFile, err := os.CreateTemp(dir, "visualmodels-*.js")
	if err != nil {
		log.Printf("Failed to create temp file for visualmodels write: %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpPath := tmpFile.Name()
	if _, err := tmpFile.WriteString(body.Content); err != nil {
		log.Printf("Failed to write temp visualmodels file: %v", err)
		tmpFile.Close()
		os.Remove(tmpPath)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	if err := os.Rename(tmpPath, fullPath); err != nil {
		log.Printf("Failed to replace visualmodels.js: %v", err)
		os.Remove(tmpPath)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"ok":true}`)
}



func fetchAndExtractContent(w http.ResponseWriter, r *http.Request) {
	// Get URL parameter
	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	log.Printf("Content extraction request for URL: %s", targetURL)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Allow redirects but limit to 5
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	// Build request with browser-like headers
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Add browser-like headers
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	// Fetch the page
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching URL: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch URL: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Check content type
	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "text/html") && !strings.Contains(contentType, "application/xhtml+xml") {
		log.Printf("Unsupported content type: %s", contentType)
		http.Error(w, "URL does not point to HTML content", http.StatusBadRequest)
		return
	}

	// Read body with size limit (5MB)
	limitedReader := io.LimitReader(resp.Body, 5*1024*1024)
	body, err := io.ReadAll(limitedReader)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Failed to read page content", http.StatusInternalServerError)
		return
	}

	// Simple content extraction - in reality, you'd want to use a more robust algorithm
	extractedContent, contentType := extractMainContent(body, targetURL)

	// Return the extracted content as JSON
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Format the response
	response := map[string]interface{}{
		"url":         targetURL,
		"content":     extractedContent,
		"contentType": contentType,
		"extractedAt": time.Now().Format(time.RFC3339),
	}

	// Encode as JSON
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// Content extraction helper function
func extractMainContent(body []byte, url string) (string, string) {
	// Convert body to string
	htmlContent := string(body)

	// Check for specific content patterns based on URL
	if strings.Contains(url, "weather") || strings.Contains(url, "forecast") {
		return extractWeatherContent(htmlContent, url), "weather"
	}

	// Default extraction for general content
	return extractGeneralContent(htmlContent), "general"
}

func extractWeatherContent(htmlContent, url string) string {
	// This would be specialized for weather sites
	var extracted strings.Builder

	// Use the URL to determine which extraction strategy to use
	siteSpecific := false

	// Check for specific weather domains to apply custom extraction
	if strings.Contains(url, "weather.com") {
		// Weather.com specific patterns
		tempPattern := regexp.MustCompile(`<span[^>]*class="CurrentConditions[^"]*">([^<]+)</span>`)
		tempMatches := tempPattern.FindAllStringSubmatch(htmlContent, 2)
		if len(tempMatches) > 0 && len(tempMatches[0]) > 1 {
			extracted.WriteString("🌡️ Current conditions: " + tempMatches[0][1] + "\n\n")
			siteSpecific = true
		}
	} else if strings.Contains(url, "accuweather") {
		// AccuWeather specific patterns
		tempPattern := regexp.MustCompile(`<div[^>]*class="temperature">([^<]+)</div>`)
		tempMatches := tempPattern.FindAllStringSubmatch(htmlContent, 1)
		if len(tempMatches) > 0 && len(tempMatches[0]) > 1 {
			extracted.WriteString("🌡️ Temperature: " + tempMatches[0][1] + "\n\n")
			siteSpecific = true
		}
	}

	// If no site-specific extraction worked, fall back to generic patterns
	if !siteSpecific {
		// Look for temperature patterns
		tempPattern := regexp.MustCompile(`(\d+)°(C|F)`)
		tempMatches := tempPattern.FindAllString(htmlContent, 10)

		if len(tempMatches) > 0 {
			extracted.WriteString("🌡️ Temperature: " + strings.Join(tempMatches[:1], ", ") + "\n\n")
		}
	}

	// General forecast data extraction (for all weather sites)
	forecastPattern := regexp.MustCompile(`(?i)forecast|precipitation|chance of rain|humidity|wind|feels like`)

	// Split HTML by paragraphs and look for relevant sections
	paragraphs := strings.Split(htmlContent, "</p>")
	for _, p := range paragraphs {
		if forecastPattern.MatchString(p) {
			// Clean up HTML tags
			cleaned := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(p, " ")
			cleaned = strings.TrimSpace(cleaned)
			cleaned = regexp.MustCompile(`\s+`).ReplaceAllString(cleaned, " ")

			if len(cleaned) > 10 && len(cleaned) < 300 {
				extracted.WriteString(cleaned + "\n\n")
			}
		}
	}

	result := extracted.String()
	if len(result) < 50 {
		// Fall back to general content extraction if we didn't get enough weather-specific info
		return extractGeneralContent(htmlContent)
	}

	return result
}

func extractGeneralContent(htmlContent string) string {
	// Remove scripts, styles, and comments first
	noScripts := regexp.MustCompile(`(?s)<script.*?</script>`).ReplaceAllString(htmlContent, " ")
	noStyles := regexp.MustCompile(`(?s)<style.*?</style>`).ReplaceAllString(noScripts, " ")
	noComments := regexp.MustCompile(`(?s)<!--.*?-->`).ReplaceAllString(noStyles, " ")

	// Extract content from paragraphs
	paragraphPattern := regexp.MustCompile(`<p[^>]*>(.*?)</p>`)
	matches := paragraphPattern.FindAllStringSubmatch(noComments, -1)

	var content strings.Builder
	for _, match := range matches {
		if len(match) > 1 {
			// Clean up HTML tags and whitespace
			cleaned := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(match[1], " ")
			cleaned = strings.TrimSpace(cleaned)
			cleaned = regexp.MustCompile(`\s+`).ReplaceAllString(cleaned, " ")

			// Only include paragraphs with substantial content
			if len(cleaned) > 40 {
				content.WriteString(cleaned + "\n\n")
			}
		}
	}

	// Limit the result length
	result := content.String()
	if len(result) > 2000 {
		return result[:2000] + "..."
	}

	return result
}
func proxyPdfContent(w http.ResponseWriter, r *http.Request) {
	// Get URL parameter
	pdfUrl := r.URL.Query().Get("url")
	if pdfUrl == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	log.Printf("PDF Proxy: Attempting to fetch PDF from: %s", pdfUrl)

	// Create HTTP client with timeout and redirect handling
	client := &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Copy headers on redirect
			for key, values := range via[0].Header {
				for _, value := range values {
					req.Header.Add(key, value)
				}
			}
			// Allow up to 10 redirects (academic sites often have many redirects)
			if len(via) >= 10 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	// Build request with advanced browser-like headers
	req, err := http.NewRequest("GET", pdfUrl, nil)
	if err != nil {
		log.Printf("PDF Proxy: Error creating request: %v", err)
		http.Error(w, "Failed to create PDF request", http.StatusInternalServerError)
		return
	}

	// Add more sophisticated headers to better mimic a browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,application/pdf,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("DNT", "1")
	req.Header.Set("Referer", "https://scholar.google.com/")

	// Fetch the PDF
	log.Printf("PDF Proxy: Sending request to %s", pdfUrl)
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("PDF Proxy: Error fetching PDF: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch PDF: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Log response status and content type
	log.Printf("PDF Proxy: Response status: %d, Content-Type: %s",
		resp.StatusCode, resp.Header.Get("Content-Type"))

	// Check response status
	if resp.StatusCode != http.StatusOK {
		log.Printf("PDF Proxy: Target server returned status %d for %s", resp.StatusCode, pdfUrl)
		http.Error(w, fmt.Sprintf("PDF source returned status %d", resp.StatusCode), resp.StatusCode)
		return
	}

	// Read response with size limit (20MB for PDFs)
	limitedReader := io.LimitReader(resp.Body, 20*1024*1024)
	pdfData, err := io.ReadAll(limitedReader)
	if err != nil {
		log.Printf("PDF Proxy: Error reading PDF data: %v", err)
		http.Error(w, "Failed to read PDF content", http.StatusInternalServerError)
		return
	}

	log.Printf("PDF Proxy: Successfully retrieved %d bytes", len(pdfData))

	// Set response headers
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=document.pdf")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfData)))
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Cache-Control", "public, max-age=86400") // Cache PDFs for a day

	// Write PDF data to response
	w.Write(pdfData)
}
func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("cmd", "/c", "start", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}

	if err != nil {
		log.Printf("Error opening browser: %v", err)
	}
}

// Image search handler for SlideForge image inclusion
func proxyImageSearch(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Only allow GET requests
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get query parameter
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter 'q'", http.StatusBadRequest)
		return
	}

	log.Printf("[%s] Image search request for: %s", time.Now().Format(time.RFC3339), query)

	// Try Pixabay first (more reliable for demo)
	imageURL, err := searchPixabayImage(query)
	if err != nil {
		log.Printf("Pixabay search failed: %v", err)
		// Try Pexels as backup
		imageURL, err = searchPexelsImage(query)
		if err != nil {
			log.Printf("Pexels search also failed: %v", err)
			// Return error response
			response := map[string]interface{}{
				"success": false,
				"error":   "No images found from available sources",
				"query":   query,
			}
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(response)
			return
		}
	}

	// Return successful response
	response := map[string]interface{}{
		"success":  true,
		"imageUrl": imageURL,
		"query":    query,
	}
	json.NewEncoder(w).Encode(response)
}

// Search for images using Pexels API (primary source)
func searchPexelsImage(query string) (string, error) {
	// Pexels API endpoint
	apiURL := fmt.Sprintf("https://api.pexels.com/v1/search?query=%s&per_page=1&orientation=landscape",
		url.QueryEscape(query))

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", err
	}

	// Add Pexels API key (you would need to set this as an environment variable or config)
	// For now, we'll use the public demo endpoint approach
	req.Header.Set("Authorization", "563492ad6f91700001000001f68e3c65de984e8199c0a6bc3f0a04a7")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pexels API returned status: %d", resp.StatusCode)
	}

	var result struct {
		Photos []struct {
			Src struct {
				Medium string `json:"medium"`
			} `json:"src"`
		} `json:"photos"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Photos) == 0 {
		return "", errors.New("no images found")
	}

	return result.Photos[0].Src.Medium, nil
}

// Search for images using Pixabay API (backup source)
func searchPixabayImage(query string) (string, error) {
	// Pixabay API endpoint
	apiURL := fmt.Sprintf("https://pixabay.com/api/?key=9656065-a4094594c34f9ac14c7fc4c39&q=%s&image_type=photo&per_page=3&min_width=640&orientation=horizontal",
		url.QueryEscape(query))

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(apiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pixabay API returned status: %d", resp.StatusCode)
	}

	var result struct {
		Hits []struct {
			WebformatURL string `json:"webformatURL"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Hits) == 0 {
		return "", errors.New("no images found")
	}

	return result.Hits[0].WebformatURL, nil
}

// Multi-image search handler for SlideForge sidebar UI
func proxyImageSearchMulti(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter 'q'", http.StatusBadRequest)
		return
	}
	log.Printf("[%s] Multi-image search request for: %s", time.Now().Format(time.RFC3339), query)

	var images []string
	// Try Pixabay first (up to 5 results)
	pixabayImages, err := searchPixabayImagesMulti(query, 12)
	if err == nil && len(pixabayImages) > 0 {
		images = append(images, pixabayImages...)
	}
	// Try Pexels (up to 5 results)
	pexelsImages, err := searchPexelsImagesMulti(query, 12)
	if err == nil && len(pexelsImages) > 0 {
		images = append(images, pexelsImages...)
	}
	if len(images) == 0 {
		response := map[string]interface{}{
			"success": false,
			"images":  []string{},
			"error":   "No images found from available sources",
			"query":   query,
		}
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(response)
		return
	}
	response := map[string]interface{}{
		"success": true,
		"images":  images,
		"query":   query,
	}
	json.NewEncoder(w).Encode(response)
}

// Multi-image search for Pixabay (returns up to n images)
func searchPixabayImagesMulti(query string, n int) ([]string, error) {
	apiURL := fmt.Sprintf("https://pixabay.com/api/?key=9656065-a4094594c34f9ac14c7fc4c39&q=%s&image_type=photo&per_page=%d&min_width=640&orientation=horizontal", url.QueryEscape(query), n)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pixabay API returned status: %d", resp.StatusCode)
	}
	var result struct {
		Hits []struct {
			WebformatURL string `json:"webformatURL"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Hits) == 0 {
		return nil, errors.New("no images found")
	}
	var urls []string
	for i, hit := range result.Hits {
		if i >= n {
			break
		}
		urls = append(urls, hit.WebformatURL)
	}
	return urls, nil
}

// Multi-image search for Pexels (returns up to n images)
func searchPexelsImagesMulti(query string, n int) ([]string, error) {
	apiURL := fmt.Sprintf("https://api.pexels.com/v1/search?query=%s&per_page=%d&orientation=landscape", url.QueryEscape(query), n)
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "563492ad6f91700001000001f68e3c65de984e8199c0a6bc3f0a04a7")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pexels API returned status: %d", resp.StatusCode)
	}
	var result struct {
		Photos []struct {
			Src struct {
				Medium string `json:"medium"`
			} `json:"src"`
		} `json:"photos"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Photos) == 0 {
		return nil, errors.New("no images found")
	}
	var urls []string
	for i, photo := range result.Photos {
		if i >= n {
			break
		}
		urls = append(urls, photo.Src.Medium)
	}
	return urls, nil
}

func serverInfoHandler(w http.ResponseWriter, r *http.Request) {
	port := "8182"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	info := map[string]interface{}{
		"serverIP":   "localhost", // Only localhost now
		"serverPort": port,
		"networkURL": nil, // Remove network URL
		"localURL":   "http://localhost:" + port,
		"timestamp":  time.Now().Format(time.RFC3339),
		"security":   "localhost-only",
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(info)
}
func main() {
	// Get port from command line argument or use default
	port := "8182"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	// Setup file server
	execDir := filepath.Dir(os.Args[0])
	log.Printf("Executable directory: %s", execDir)

	appDir := filepath.Join(execDir, "app")
	log.Printf("Serving files from: %s", appDir)

	// Create HTTP multiplexer
	mux := http.NewServeMux()

	// File server for static content
	fs := http.FileServer(http.Dir(appDir))
	mux.Handle("/", noCacheHandler(fs))

	// API endpoints
	mux.HandleFunc("/api/library/", proxyOllamaLibrary)
	mux.HandleFunc("/api/library", proxyOllamaLibrary)
	mux.HandleFunc("/api/extract/content", fetchAndExtractContent)
	mux.HandleFunc("/api/search/bing", proxyBingSearch)
	mux.HandleFunc("/api/extract/raw-html", fetchRawHtmlForLinks)
	mux.HandleFunc("/api/proxy/pdf", proxyPdfContent)
	mux.HandleFunc("/api/proxy/image-search", proxyImageSearch)
	mux.HandleFunc("/api/version-check", proxyVersionCheck)
	mux.HandleFunc("/api/server-info", serverInfoHandler)
	mux.HandleFunc("/api/proxy/image-search-multi", proxyImageSearchMulti) // New endpoint
	// Thinking models management (read/write thinkingmodels.js)
	mux.HandleFunc("/api/thinkingmodels", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" || r.Method == "OPTIONS" {
			thinkingModelsGetHandler(w, r)
			return
		}
		if r.Method == "POST" {
			thinkingModelsPostHandler(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})
	// Visual models management
	mux.HandleFunc("/api/visualmodels", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" || r.Method == "OPTIONS" {
			visualModelsGetHandler(w, r)
			return
		}
		if r.Method == "POST" {
			visualModelsPostHandler(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// SECURITY: Create server that binds only to localhost
	server := &http.Server{
		Addr:         fmt.Sprintf("localhost:%s", port), // Only localhost, no 0.0.0.0
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	// Security-focused startup messages
	log.Printf("🔒 Secure Paiperwork server starting on:")
	log.Printf("   http://localhost:%s", port)
	log.Printf("   http://127.0.0.1:%s", port)
	log.Printf("")
	log.Printf("🛡️  SECURITY: Server restricted to localhost access only")
	log.Printf("💡 This ensures your data remains encrypted and secure")
	log.Printf("🚫 Network access disabled for enterprise security")

	// Open browser to localhost
	localURL := fmt.Sprintf("http://localhost:%s", port)
	go func() {
		// Small delay to ensure server is ready
		time.Sleep(1 * time.Second)
		openBrowser(localURL)
	}()

	// Start the secure server
	log.Fatal(server.ListenAndServe())
}
