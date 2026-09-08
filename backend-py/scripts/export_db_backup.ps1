<#
.SYNOPSIS
    Exports the full application database (every table's schema + data) to a
    single portable .sql script, via SQL Server Management Objects (SMO).

.DESCRIPTION
    Unlike a native .bak backup, this produces a plain-text T-SQL script
    (UTF-16, as SMO always writes) containing CREATE TABLE + INSERT
    statements for every user table — restorable on any SQL Server instance
    via sqlcmd, not just one running the same SQL Server version/edition.
    Every CREATE TABLE is wrapped in an IF NOT EXISTS guard, so the output is
    safe to run against a database that already has some of these tables.

    Defaults match this app's own .env (SQL_SERVER/SQL_INSTANCE/SQL_DATABASE)
    — override with -Server/-Database if you're pointing at a different
    environment (e.g. staging).

.PARAMETER Server
    SQL Server instance, e.g. "JANITHA-PC\SQLEXPRESS".

.PARAMETER Database
    Database name, e.g. "Adobe-FC".

.PARAMETER OutFile
    Destination .sql file. Defaults to a timestamped file under D:\DB-Backups
    (outside the repo, so it never accidentally gets committed — these
    exports contain real data: encrypted user PII, hashed passwords, and
    encrypted SMTP/FabriX/Groq/SFTP secrets from AdminSettings).

.EXAMPLE
    .\export_db_backup.ps1

.EXAMPLE
    .\export_db_backup.ps1 -Server "JANITHA-PC\SQLEXPRESS" -Database "Adobe-FC" -OutFile "D:\DB-Backups\pre-deploy.sql"

.EXAMPLE
    Restore elsewhere with:
        sqlcmd -S <target_server> -d <target_database> -E -i "<OutFile>"
#>
param(
    [string]$Server = "JANITHA-PC\SQLEXPRESS",
    [string]$Database = "Adobe-FC",
    [string]$OutFile = "D:\DB-Backups\Adobe-FC_schema_and_data_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').sql"
)

Import-Module SQLPS -DisableNameChecking -ErrorAction Stop | Out-Null

$outDir = Split-Path -Parent $OutFile
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}
if (Test-Path $OutFile) { Remove-Item $OutFile -Force }

$srv = New-Object Microsoft.SqlServer.Management.Smo.Server($Server)
$srv.ConnectionContext.StatementTimeout = 0
$db = $srv.Databases[$Database]
if ($null -eq $db) {
    throw "Database '$Database' not found on server '$Server'."
}

# Every application schema this database currently uses gets a matching
# CREATE SCHEMA guard up front, so restoring into a brand-new/empty database
# doesn't fail on "schema does not exist" before the first CREATE TABLE runs.
$schemas = $db.Tables | Where-Object { -not $_.IsSystemObject } | Select-Object -ExpandProperty Schema -Unique
$schemaHeader = ($schemas | ForEach-Object {
    "IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '$_') EXEC('CREATE SCHEMA [$_]');`r`nGO`r`n"
}) -join "`r`n"
Set-Content -Path $OutFile -Value $schemaHeader -Encoding Unicode -NoNewline

$scrp = New-Object Microsoft.SqlServer.Management.Smo.Scripter($srv)
$options = New-Object Microsoft.SqlServer.Management.Smo.ScriptingOptions
$options.ScriptSchema = $true
$options.ScriptData = $true
$options.EnforceScriptingOptions = $true
$options.ContinueScriptingOnError = $true
$options.ToFileOnly = $true
$options.FileName = $OutFile
$options.IncludeHeaders = $false
$options.AppendToFile = $true
$options.AnsiPadding = $false
$options.DriAll = $true
$options.Indexes = $true
$options.Triggers = $false
$options.NoCollation = $true
$options.IncludeIfNotExists = $true
$options.ScriptDrops = $false
$options.WithDependencies = $true
$scrp.Options = $options

$tables = $db.Tables | Where-Object { -not $_.IsSystemObject }
Write-Output "Scripting $($tables.Count) tables (schema + data) from [$Server].[$Database] to $OutFile ..."
$tables | Group-Object Schema | ForEach-Object { Write-Output "  schema $($_.Name): $($_.Count) tables" }

[Microsoft.SqlServer.Management.Sdk.Sfc.Urn[]]$urns = $tables | ForEach-Object { $_.Urn }
$scrp.EnumScript($urns)

$sizeMB = [math]::Round((Get-Item $OutFile).Length / 1MB, 2)
Write-Output "Done. $OutFile ($sizeMB MB)"
Write-Output ""
Write-Output "Restore elsewhere with:"
Write-Output "  sqlcmd -S <target_server> -d <target_database> -E -i `"$OutFile`""
