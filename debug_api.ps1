$body = @{
    employee_id = "SUPER001"
    password    = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "TOKEN RECEIVED"
    
    $headers = @{
        Authorization = "Bearer " + $response.data.token
    }
    
    $systemBody = @{
        name        = "TestSystemForDebug"
        description = "Debug"
        icon_name   = "settings"
    } | ConvertTo-Json
    
    Write-Host "Sending POST /api/diagnosis/systems..."
    try {
        $sysResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/diagnosis/systems" -Method Post -Body $systemBody -ContentType "application/json" -Headers $headers
        Write-Host "SUCCESS:"
        $sysResponse | ConvertTo-Json -Depth 5
    }
    catch {
        Write-Host "ERROR:"
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            Write-Host "Status Code: " $_.Exception.Response.StatusCode
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody"
        }
        else {
            Write-Host "No response received (Server down?)"
        }
    }

}
catch {
    Write-Host "LOGIN FAILED:"
    Write-Host $_.Exception.Message
}
