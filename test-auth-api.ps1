$body = @{
    employee_id = "SUPER001"
    password    = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "TOKEN:" $response.data.token
    
    # Now try to add a system with this token
    $headers = @{
        Authorization = "Bearer " + $response.data.token
    }
    
    $systemBody = @{
        name        = "Test System PowerShell"
        description = "Test Description"
        icon_name   = "settings"
    } | ConvertTo-Json
    
    Write-Host "Trying to add system..."
    try {
        $sysResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/diagnosis/systems" -Method Post -Body $systemBody -ContentType "application/json" -Headers $headers
        Write-Host "SUCCESS:"
        $sysResponse | ConvertTo-Json -Depth 5
    }
    catch {
        Write-Host "ERROR ADDING SYSTEM:"
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody"
        }
    }

}
catch {
    Write-Host "LOGIN FAILED:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
