# PowerShell script to test file upload to AI Compliance Scanner
param(
    [string]$FilePath = "D:\FinMark\personal_loans_l.png",
    [string]$ApiUrl = "http://localhost:3001/api/documents/upload"
)

Write-Host "Testing AI Compliance Scanner File Upload..." -ForegroundColor Green

# Check if file exists
if (-not (Test-Path $FilePath)) {
    Write-Host "Error: File not found at $FilePath" -ForegroundColor Red
    exit 1
}

Write-Host "File found: $FilePath" -ForegroundColor Yellow

# Check if backend is running
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Write-Host "Backend is running: $($healthCheck)" -ForegroundColor Green
} catch {
    Write-Host "Backend not responding. Starting backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd 'D:\FinMark\deploy\ai-compliance-scanner\backend-mvp'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 10
}

# Prepare multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
$fileName = [System.IO.Path]::GetFileName($FilePath)

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"document`"; filename=`"$fileName`"",
    "Content-Type: image/png",
    "",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
    "--$boundary--"
) -join $LF

try {
    Write-Host "Uploading file..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary" -TimeoutSec 30
    
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    if ($response.document -and $response.document.id) {
        $documentId = $response.document.id
        Write-Host "Document ID: $documentId" -ForegroundColor Yellow
        
        # Wait and check for analysis results
        Write-Host "Waiting for analysis to complete..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        try {
            $analysisResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/analysis/documents/$documentId/results" -Method Get -TimeoutSec 10
            Write-Host "Analysis Results:" -ForegroundColor Green
            Write-Host "$($analysisResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
        } catch {
            Write-Host "Analysis not ready yet or error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "Test completed." -ForegroundColor Green
