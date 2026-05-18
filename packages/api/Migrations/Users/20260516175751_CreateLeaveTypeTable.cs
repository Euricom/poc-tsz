using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations.Users
{
    /// <inheritdoc />
    public partial class CreateLeaveTypeTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LeaveTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Allowed = table.Column<int>(type: "INTEGER", nullable: false),
                    DefaultTotalDays = table.Column<int>(type: "INTEGER", nullable: true),
                    Color = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    IsArchived = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveTypes", x => x.Id);
                });

            migrationBuilder.Sql(
                @"CREATE UNIQUE INDEX ""IX_LeaveTypes_Name"" ON ""LeaveTypes"" (""Name"" COLLATE NOCASE) WHERE ""IsArchived"" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeaveTypes");
        }
    }
}
