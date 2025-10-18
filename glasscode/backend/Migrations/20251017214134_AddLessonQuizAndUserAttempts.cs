using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonQuizAndUserAttempts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LessonQuizzes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Question = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Topic = table.Column<string>(type: "text", nullable: true),
                    Difficulty = table.Column<string>(type: "text", nullable: false),
                    Choices = table.Column<string>(type: "text", nullable: true),
                    Explanation = table.Column<string>(type: "text", nullable: true),
                    IndustryContext = table.Column<string>(type: "text", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    QuestionType = table.Column<string>(type: "text", nullable: false),
                    EstimatedTime = table.Column<int>(type: "integer", nullable: false),
                    CorrectAnswer = table.Column<int>(type: "integer", nullable: true),
                    QuizType = table.Column<string>(type: "text", nullable: false),
                    Sources = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LessonId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LessonQuizzes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LessonQuizzes_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLessonQuizAttempts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SelectedAnswer = table.Column<int>(type: "integer", nullable: true),
                    UserAnswer = table.Column<string>(type: "text", nullable: true),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    TimeSpent = table.Column<int>(type: "integer", nullable: false),
                    AttemptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    LessonQuizId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLessonQuizAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserLessonQuizAttempts_LessonQuizzes_LessonQuizId",
                        column: x => x.LessonQuizId,
                        principalTable: "LessonQuizzes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserLessonQuizAttempts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LessonQuizzes_LessonId",
                table: "LessonQuizzes",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLessonQuizAttempts_LessonQuizId",
                table: "UserLessonQuizAttempts",
                column: "LessonQuizId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLessonQuizAttempts_UserId",
                table: "UserLessonQuizAttempts",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserLessonQuizAttempts");

            migrationBuilder.DropTable(
                name: "LessonQuizzes");
        }
    }
}
