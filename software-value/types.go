package main

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
	LanguageName       string `json:"LanguageName"`
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
