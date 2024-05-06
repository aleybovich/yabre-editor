package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	// Specify the directory containing the static files (js, css, html)
	staticDir := "./static"

	// Specify the directory containing the YAML rules definitions
	rulesDir := "./rules"

	apiBase := "/api/rules"

	// Create a file server handler for the static directory
	fileServer := http.FileServer(http.Dir(staticDir))

	// Create a request handler that serves the static files
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Serve the static files using the file server handler
		fileServer.ServeHTTP(w, r)
	})

	// Create an API endpoint to return the list of available YAML rules definitions
	http.HandleFunc(fmt.Sprintf("GET %s", apiBase), func(w http.ResponseWriter, r *http.Request) {
		// Read the rules directory and get the list of YAML files
		files, err := os.ReadDir(rulesDir)
		if err != nil {
			http.Error(w, "Failed to read rules directory", http.StatusInternalServerError)
			return
		}

		// Filter the files to include only YAML files
		var yamlFiles []string
		for _, file := range files {
			if filepath.Ext(file.Name()) == ".yaml" {
				yamlFiles = append(yamlFiles, strings.TrimSuffix(file.Name(), filepath.Ext(file.Name())))
			}
		}

		// Set the response content type to JSON
		w.Header().Set("Content-Type", "application/json")

		// Write the list of YAML files as JSON response
		json.NewEncoder(w).Encode(yamlFiles)
	})

	// Create an API endpoint to submit a new rule
	http.HandleFunc(fmt.Sprintf("POST %s/{name}", apiBase), func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")

		// Read the request body
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}

		// Create the file path for the new rule
		filePath := filepath.Join(rulesDir, name+".yaml")

		// Write the rule content to the file
		err = os.WriteFile(filePath, body, 0644)
		if err != nil {
			http.Error(w, "Failed to save rule", http.StatusInternalServerError)
			return
		}

		// Set the response status code to 201 (Created)
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Rule created successfully"))
	})

	// Create an API endpoint to update an existing rule
	http.HandleFunc(fmt.Sprintf("PUT %s/{name}", apiBase), func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")

		// Read the request body
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}

		// Create the file path for the existing rule
		filePath := filepath.Join(rulesDir, name+".yaml")

		// Check if the rule file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.Error(w, "Rule not found", http.StatusNotFound)
			return
		}

		// Update the rule content in the file
		err = os.WriteFile(filePath, body, 0644)
		if err != nil {
			http.Error(w, "Failed to update rule", http.StatusInternalServerError)
			return
		}

		// Set the response status code to 200 (OK)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Rule updated successfully"))
	})

	// Create an API endpoint to load a specific rule by name and return the YAML content
	http.HandleFunc(fmt.Sprintf("GET %s/{name}", apiBase), func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")

		// Create the file path for the rule
		filePath := filepath.Join(rulesDir, name+".yaml")

		// Check if the rule file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.Error(w, "Rule not found", http.StatusNotFound)
			return
		}

		// Read the rule content from the file
		ruleContent, err := os.ReadFile(filePath)
		if err != nil {
			http.Error(w, "Failed to read rule", http.StatusInternalServerError)
			return
		}

		// Set the response content type to YAML
		w.Header().Set("Content-Type", "application/yaml")

		// Write the rule content as the response
		w.Write(ruleContent)
	})

	// Start the server
	log.Println("Server is running on http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
