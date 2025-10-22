using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAcceptedAnswersToLessonQuiz : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcceptedAnswers",
                table: "LessonQuizzes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChoiceLabels",
                table: "LessonQuizzes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FixedChoiceOrder",
                table: "LessonQuizzes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedAnswers",
                table: "LessonQuizzes");

            migrationBuilder.DropColumn(
                name: "ChoiceLabels",
                table: "LessonQuizzes");

            migrationBuilder.DropColumn(
                name: "FixedChoiceOrder",
                table: "LessonQuizzes");
        }
    }
}
