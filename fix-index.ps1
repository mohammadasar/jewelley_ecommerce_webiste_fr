# PowerShell script to fix index.html
$file = "index.html"
$content = Get-Content $file -Raw

# Find the position after the footer text
$searchText = "&copy; 2025 Guru Jewellery. Handcrafted with ✨`r`n            </p>"
$position = $content.IndexOf($searchText)

if ($position -ge 0) {
    # Get everything up to and including the search text
    $goodContent = $content.Substring(0, $position + $searchText.Length)
    
    # Add the proper ending
    $properEnding = @"
`r`n            <p class="footer__note">
                Frontend-only demo • All data stored locally
            </p>
        </div>
    </footer>

    <!-- Toast Notification -->
    <div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>

    <script src="./JS/app.js"></script>
    <script src="./JS/signup-popup.js"></script>

</body>

</html>
"@
    
    # Combine and save
    $fixedContent = $goodContent + $properEnding
    $fixedContent | Set-Content $file -NoNewline
    
    Write-Host "File fixed successfully!" -ForegroundColor Green
} else {
    Write-Host "Could not find the marker text" -ForegroundColor Red
}
