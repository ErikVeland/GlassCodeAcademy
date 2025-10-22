using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

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

    // Custom converter to handle both string and array formats for ChoiceLabels
    public class ChoiceLabelsConverter : JsonConverter<List<string>>
    {
        public override List<string> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                // Handle string value (e.g., "letters")
                var value = reader.GetString();
                return new List<string> { value };
            }
            else if (reader.TokenType == JsonTokenType.StartArray)
            {
                // Handle array of strings
                return JsonSerializer.Deserialize<List<string>>(ref reader, options);
            }
            else
            {
                // Handle null or other cases
                reader.Skip();
                return null;
            }
        }

        public override void Write(Utf8JsonWriter writer, List<string> value, JsonSerializerOptions options)
        {
            if (value != null && value.Count == 1)
            {
                // Write as string if it's a single-item list
                writer.WriteStringValue(value[0]);
            }
            else
            {
                // Write as array
                JsonSerializer.Serialize(writer, value, options);
            }
        }
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
        // New fields
        public bool? FixedChoiceOrder { get; set; }
        [JsonConverter(typeof(ChoiceLabelsConverter))]
        public List<string>? ChoiceLabels { get; set; }
        public List<string>? AcceptedAnswers { get; set; }
    }
}