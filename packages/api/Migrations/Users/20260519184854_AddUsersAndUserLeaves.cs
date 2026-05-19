using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations.Users
{
    /// <inheritdoc />
    public partial class AddUsersAndUserLeaves : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserLeaves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    LeaveTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    Year = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalDays = table.Column<int>(type: "INTEGER", nullable: true),
                    TakenDays = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLeaves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserLeaves_LeaveTypes_LeaveTypeId",
                        column: x => x.LeaveTypeId,
                        principalTable: "LeaveTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserLeaves_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(
                @"CREATE UNIQUE INDEX ""IX_Users_Email"" ON ""Users"" (""Email"" COLLATE NOCASE);");

            migrationBuilder.CreateIndex(
                name: "IX_UserLeaves_LeaveTypeId",
                table: "UserLeaves",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLeaves_UserId_LeaveTypeId_Year",
                table: "UserLeaves",
                columns: new[] { "UserId", "LeaveTypeId", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserLeaves");

            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Users_Email"";");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
