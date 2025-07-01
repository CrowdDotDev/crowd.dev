package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/knadh/koanf/v2"
)

var k = koanf.New(".")

const configFile = "./config.toml"

func main() {
	var err error
	ctx := context.Background()

	config := getConfig(configFile)

	insightsDb, err := NewInsightsDB(ctx, config.InsightsDatabase)
	if err != nil {
		log.Fatalf("Error connecting to insights database: %v", err)
	}
	defer insightsDb.Close()

	cmdb, err := NewCMDB(ctx, config.CMDatabase)
	if err != nil {
		log.Fatalf("Error connecting to CM database: %v", err)
	}
	defer cmdb.Close()

	repoDirs, err := findRepositoriesDirectories(config.TargetPath)
	if err != nil {
		log.Fatalf("Error finding subdirectories: %v", err)
	}

	batchSize := config.BatchSize
	var batch []SCCReport

	for _, repoDir := range repoDirs {
		gitUrl, err := getGitRepositoryURL(repoDir)
		if err != nil {
			log.Printf("Could not get the git repository URL for '%s': %v", repoDir, err)
			continue
		}

		report, err := getSCCReport(config.SCCPath, repoDir)
		if err != nil {
			log.Printf("Error processing repository '%s': %v", repoDir, err)
			continue
		}
		report.Repository.URL = gitUrl

		batch = append(batch, report)

		fmt.Printf("Directory: %s", repoDir)
		fmt.Printf("Estimated Cost in Dollars: %.2f\n", report.Cocomo.CostInDollars)
		fmt.Printf("Git URL: %s\n\n", gitUrl)

		if len(batch) >= batchSize {
			saveBatch(ctx, insightsDb, batch)
			batch = batch[:0]
		}
	}
	// Save any remaining reports
	if len(batch) > 0 {
		saveBatch(ctx, insightsDb, batch)
	}
}

// findRepositoriesDirectories returns all immediate subdirectories within the given path, which contain a .git directory.
// This creates a list (repoDirs) with all the repositories into memory.
// At the time of writing, we have a little over 14K directories.
// It doesn't seem to be a problem for now, but we should keep this in mind in the future with more repositories.
func findRepositoriesDirectories(dirPath string) ([]string, error) {
	var repoDirs []string

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory '%s': %w", dirPath, err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			subdirPath := filepath.Join(dirPath, entry.Name())
			gitDirPath := filepath.Join(subdirPath, ".git")
			if stat, err := os.Stat(gitDirPath); err == nil && stat.IsDir() {
				repoDirs = append(repoDirs, subdirPath)
			} else {
				log.Printf("Skipping directory '%s', it does not contain a .git directory.", subdirPath)
			}
		}
	}

	if len(repoDirs) == 0 {
		log.Printf("No git repositories found in %s", dirPath)
	}

	return repoDirs, nil
}

// getSCCReport analyzes a directory with scc and returns a report containing the estimated cost and language statistics.
func getSCCReport(sccPath, dirPath string) (SCCReport, error) {
	cost, err := getCost(sccPath, dirPath)
	if err != nil {
		return SCCReport{}, fmt.Errorf("error getting SCC report for '%s': %v\"", err)
	}

	// Skip saving to database if cost is 0 - do we want to do this?
	if cost == 0 {
		return SCCReport{}, fmt.Errorf("no project cost found for '%s'", filepath.Base(dirPath))
	}

	projectPath := filepath.Base(dirPath)

	langStats, err := getLanguageStats(sccPath, dirPath)
	if err != nil {
		return SCCReport{}, fmt.Errorf("error getting language stats for '%s': %v", dirPath, err)
	}

	return SCCReport{
		Repository: Repository{
			Path: projectPath,
		},
		Cocomo:        Cocomo{CostInDollars: cost},
		LanguageStats: langStats,
	}, nil
}

// getGitRepositoryURL retrieves the URL of the git repository for a given directory path.
func getGitRepositoryURL(dirPath string) (string, error) {
	cmd := exec.Command("git", "remote", "get-url", "origin")
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get git repository URL for '%s': %w", dirPath, err)
	}
	gitUrl := strings.TrimSpace(string(output))

	// If the URL starts with ssh://git@, replace it with https://
	if strings.HasPrefix(gitUrl, "ssh://git@") {
		gitUrl = strings.Replace(gitUrl, "ssh://git@", "https://", 1)
	}

	// If the URL starts with http://, replace it with https://
	if strings.HasPrefix(gitUrl, "http://") {
		gitUrl = strings.Replace(gitUrl, "http://", "https://", 1)
	}

	// If the URL starts with git@, replace it with https://
	if strings.HasPrefix(gitUrl, "git@") {
		gitUrl = strings.Replace(gitUrl, ":", "/", 1)
		gitUrl = strings.Replace(gitUrl, "git@", "https://", 1)
	}

	return gitUrl, nil
}

// getCost runs the scc command and parses the output to get the estimated cost.
func getCost(sccPathPath, repoPath string) (float64, error) {
	output, err := runSCC(sccPathPath, "--format=short", repoPath)
	if err != nil {
		return 0, fmt.Errorf("failed to run scc command: %w", err)
	}

	cost, err := parseCocomoMetrics(output)
	if err != nil {
		return 0, fmt.Errorf("failed to parse COCOMO metrics: %w", err)
	}

	return cost, nil
}

// getLanguageStats runs the scc command and parses the output to get language statistics.
func getLanguageStats(sccPathPath, repoPath string) ([]LanguageStats, error) {
	output, err := runSCC(sccPathPath, "--format=json", repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to run scc command: %w", err)
	}

	var langStats []LanguageStats
	if err := json.Unmarshal([]byte(output), &langStats); err != nil {
		return nil, fmt.Errorf("failed to unmarshal scc output to get language statistics: %w", err)
	}

	return langStats, nil
}

// runSCC executes the scc command with the given arguments and returns the output.
func runSCC(sccPathPath string, args ...string) (string, error) {
	cmd := exec.Command(sccPathPath, args...)
	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("scc command failed: %w\nStderr: %s", err, string(exitErr.Stderr))
		}
		return "", fmt.Errorf("scc command failed: %w", err)
	}
	return string(output), nil
}

// parseCocomoMetrics parses the output of the scc command to extract the estimated cost.
func parseCocomoMetrics(output string) (float64, error) {
	//var cocomo Cocomo

	var cost float64
	var err error
	var costRegex = regexp.MustCompile(`Estimated Cost to Develop \(.*?\) \$([0-9,]+)`)

	if matches := costRegex.FindStringSubmatch(output); len(matches) > 1 {
		costStr := strings.ReplaceAll(matches[1], ",", "")
		cost, err = strconv.ParseFloat(costStr, 64)
		if err != nil {
			return 0, fmt.Errorf("failed to parse cost '%s': %w", costStr, err)
		}
	} else {
		return 0, fmt.Errorf("could not find estimated cost in scc output")
	}

	return cost, nil
}

func saveBatch(ctx context.Context, db *InsightsDB, batch []SCCReport) {
	for _, report := range batch {
		if err := db.saveProjectCost(ctx, report.Repository, report.Cocomo.CostInDollars); err != nil {
			log.Printf("Error saving project cost for '%s': %v", report.Repository, err)
		}

		if err := db.saveLanguageStats(ctx, report.Repository, report.LanguageStats); err != nil {
			log.Printf("Error saving language stats for '%s': %v", report.Repository, err)
		}
	}
}
