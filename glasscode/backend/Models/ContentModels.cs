using System;
using System.Collections.Generic;

namespace backend.Models
{
    // Data models for registry parsing
    public class ModuleRegistryData
    {
        public List<ModuleData> Modules { get; set; } = new();
    }
    
    public class ModuleData
    {
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Tier { get; set; } = string.Empty;
        public string Track { get; set; } = string.Empty;
        public List<string> Prerequisites { get; set; } = new();
        public ModuleThresholds? Thresholds { get; set; }
    }
    
    public class ModuleThresholds
    {
        public int RequiredLessons { get; set; }
        public int RequiredQuestions { get; set; }
    }
    
    // Data models for quiz parsing
    public class QuizFileData
    {
        public List<QuizQuestion> Questions { get; set; } = new();
    }
    
    public class QuizQuestion
    {
        public int? Id { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public List<string>? Choices { get; set; }
        public int? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
        public string? Difficulty { get; set; }
        public string? QuestionType { get; set; }
        public List<string>? Sources { get; set; }
        public string? IndustryContext { get; set; }
        public List<string>? Tags { get; set; }
        public int? EstimatedTime { get; set; }
    }
}