using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class StringArrayFlexibleConverter : JsonConverter<string[]>
    {
        public override string[] Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartArray)
            {
                var list = new List<string>();
                while (reader.Read())
                {
                    if (reader.TokenType == JsonTokenType.EndArray) break;
                    if (reader.TokenType == JsonTokenType.String)
                    {
                        list.Add(reader.GetString() ?? string.Empty);
                    }
                    else
                    {
                        // Skip non-string items safely
                        reader.Skip();
                    }
                }
                return list.ToArray();
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                return new[] { reader.GetString() ?? string.Empty };
            }

            if (reader.TokenType == JsonTokenType.Null)
            {
                // Property is nullable; represent null as empty array for safety
                return Array.Empty<string>();
            }

            try
            {
                using var doc = JsonDocument.ParseValue(ref reader);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.String)
                {
                    return new[] { root.GetString() ?? string.Empty };
                }
                if (root.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var el in root.EnumerateArray())
                    {
                        if (el.ValueKind == JsonValueKind.String)
                        {
                            list.Add(el.GetString() ?? string.Empty);
                        }
                    }
                    return list.ToArray();
                }
            }
            catch
            {
                // Fall through to empty on malformed content
            }

            return Array.Empty<string>();
        }

        public override void Write(Utf8JsonWriter writer, string[] value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
                return;
            }
            writer.WriteStartArray();
            foreach (var s in value)
            {
                writer.WriteStringValue(s);
            }
            writer.WriteEndArray();
        }
    }
}