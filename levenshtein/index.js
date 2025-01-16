function levenshteinDistance(st1, st2){
    const m = st1.length;
    const n = st2.length;
    var D = [];
    // Create a 2D array with m+1 rows
    // and n+1 columns
    // D[i][j] will hold the Levenshtein distance between
    // the first i characters of st1 and the first j characters of st2

    // Initialize the first row and first column
    // D[i][0] = i
    for (var i = 0; i <= m; i++) {
        D[i] = [];
        D[i][0] = i;
    }
    // D[0][j] = j
    for (var j = 0; j <= n; j++) {
        D[0][j] = j;
    }

    // Fill in the rest of the array
    // using the recursive formula    
    for (var i = 1; i <= m; i++) {
        for (var j = 1; j <= n; j++) {
            const c = st1[i - 1] === st2[j - 1] ? 0 : 1; // cost

            D[i][j] = Math.min( D[i - 1][j] + 1, // deletion
                                D[i][j - 1] + 1, // insertion
                                D[i - 1][j - 1] + c); // substitution
        }
    }

    // The final answer is in D[m][n]
    return D[m][n];
}