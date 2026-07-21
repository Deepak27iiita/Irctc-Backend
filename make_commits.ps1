$targetDir = "C:\Users\VICTUS\OneDrive\Desktop\iRctc"
Set-Location $targetDir

if (Test-Path .git) {
    Remove-Item -Recurse -Force .git
}

git init
git remote add origin <your-repository-url>

$allFiles = Get-ChildItem -Path $targetDir -Recurse -File | Where-Object { 
    $_.FullName -notmatch "\\node_modules\\" -and 
    $_.FullName -notmatch "\\.git\\" -and 
    $_.Name -ne "make_commits.ps1" 
}

$commitCount = 37
$filesPerCommit = [math]::Ceiling($allFiles.Count / $commitCount)

$messages = @(
    "Initialize {0}",
    "Add {0} features",
    "Implement core logic in {0}",
    "Update {0}",
    "Refactor {0} components",
    "Add database models for {0}",
    "Add routes and controllers for {0}",
    "Fix minor issues in {0}",
    "Enhance {0} functionality",
    "Set up {0}"
)

$random = New-Object System.Random

for ($i = 0; $i -lt $commitCount; $i++) {
    $startIndex = $i * $filesPerCommit
    if ($startIndex -ge $allFiles.Count) { break }
    
    $endIndex = [math]::Min($startIndex + $filesPerCommit - 1, $allFiles.Count - 1)
    
    $chunk = $allFiles[$startIndex..$endIndex]
    
    foreach ($f in $chunk) {
        $relPath = $f.FullName.Replace("$targetDir\", "")
        git add "`"$relPath`""
    }
    
    $sampleFile = $chunk[0]
    $dirName = $sampleFile.Directory.Name
    if ($dirName -eq "iRctc") { $dirName = "project configuration" }
    
    $msgTemplate = $messages | Get-Random
    $commitMsg = $msgTemplate -f $dirName
    
    git commit -m "`"$commitMsg`""
}

git add .
git commit -m "Finalize project setup and minor tweaks"

git branch -M main
# git push -u origin main --force
