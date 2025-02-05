function printMonth(month, days, startDay) {
    let stHeader = `${month.toUpperCase()}\nSu Mo Tu We Th Fr Sa\n--------------------\n`;
    let stLine = " ".repeat(startDay * 3);
    for (let i = 1; i <= days; i++) {
        stLine += i.toString().padStart(2, ' ') + " ";
        if ((i + startDay) % 7 === 0 || i === days) stLine += "\n";                
    }
    console.log(stHeader + stLine);
}

printMonth('January 2025', 31, 3);
printMonth('February 2025', 28, 6);
printMonth('March 2025', 31, 6);
printMonth('April 2025', 30, 2);
printMonth('May 2025', 31, 4);
printMonth('June 2025', 30, 0);
printMonth('July 2025', 31, 2);
printMonth('August 2025', 31, 5);
printMonth('September 2025', 30, 1);
printMonth('October 2025', 31, 3);
printMonth('November 2025', 30, 6);
printMonth('December 2025', 31, 1);