package main

// Standard response structure for all outputs
type StandardResponse struct {
	Status       string  `json:"status"`
	ErrorCode    *string `json:"error_code"`
	ErrorMessage *string `json:"error_message"`
}

// Error codes for different failure scenarios
const (
	ErrorCodeInvalidArguments     = "INVALID_ARGUMENTS"
	ErrorCodeTargetPathNotFound   = "TARGET_PATH_NOT_FOUND"
	ErrorCodeSCCNotFound          = "SCC_NOT_FOUND"
	ErrorCodeDatabaseConnection   = "DATABASE_CONNECTION_ERROR"
	ErrorCodeGitRepositoryURL     = "GIT_REPOSITORY_URL_ERROR"
	ErrorCodeSCCExecution         = "SCC_EXECUTION_ERROR"
	ErrorCodeSCCParsing           = "SCC_PARSING_ERROR"
	ErrorCodeDatabaseOperation    = "DATABASE_OPERATION_ERROR"
	ErrorCodeNoCostFound          = "NO_COST_FOUND"
	ErrorCodeUnknown              = "UNKNOWN_ERROR"
)

// Status constants
const (
	StatusSuccess = "success"
	StatusFailure = "failure"
)

type Repository struct {
	Path string `json:"Path"`
	URL  string `json:"URL"`
}

type SCCReport struct {
	Repository    Repository      `json:"Repository"`
	Cocomo        Cocomo          `json:"Cocomo"`
	LanguageStats []LanguageStats `json:"LanguageStats"`
}

type Cocomo struct {
	CostInDollars  float64 `json:"CostInDollars"`
	EffortInMonths float64 `json:"EffortInMonths"`
	PeopleRequired float64 `json:"PeopleRequired"`
}

type LanguageStats struct {
	LanguageName       string `json:"Name"`
	Bytes              int    `json:"Bytes"`
	CodeBytes          int    `json:"CodeBytes"`
	Lines              int    `json:"Lines"`
	Code               int    `json:"Code"`
	Comment            int    `json:"Comment"`
	Blank              int    `json:"Blank"`
	Complexity         int    `json:"Complexity"`
	Count              int    `json:"Count"`
	WeightedComplexity int    `json:"WeightedComplexity"`
}
