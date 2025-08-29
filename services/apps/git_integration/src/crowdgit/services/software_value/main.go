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
)

func main() {
	var err error
	ctx := context.Background()

	// Get target path from command line argument
	var targetPath string
	if len(os.Args) > 1 {
		targetPath = os.Args[1]
	} else {
		log.Fatalf("Usage: %s <target-path>", os.Args[0])
	}

	config := getConfig(targetPath)

	// Process single repository (the target path argument)
	repoDir := config.TargetPath

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

	// Get git URL for the repository
	gitUrl, err := getGitRepositoryURL(repoDir)
	if err != nil {
		log.Fatalf("Could not get the git repository URL for '%s': %v", repoDir, err)
	}

	// Process the repository with SCC
	report, err := getSCCReport(config.SCCPath, repoDir)
	if err != nil {
		log.Fatalf("Error processing repository '%s': %v", repoDir, err)
	}
	report.Repository.URL = gitUrl

	// Save to database
	if err := insightsDb.saveProjectCost(ctx, report.Repository, report.Cocomo.CostInDollars); err != nil {
		log.Fatalf("Error saving project cost: %v", err)
	}

	if err := insightsDb.saveLanguageStats(ctx, report.Repository, report.LanguageStats); err != nil {
		log.Fatalf("Error saving language stats: %v", err)
	}
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


