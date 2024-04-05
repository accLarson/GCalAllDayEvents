console.log('Extension script loaded.');

function extractDates(text) {
    const months = {
        "January": 1,
        "February": 2,
        "March": 3,
        "April": 4,
        "May": 5,
        "June": 6,
        "July": 7,
        "August": 8,
        "September": 9,
        "October": 10,
        "November": 11,
        "December": 12
    };

    const dateRegexes = [
        /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b) (\d+)/, // Month Day
        /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b) (\d+) – (\d+)/, // Month Day - Day
        /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b) (\d+) – (\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b) (\d+)/ // Month Day - Month Day
    ];

    const dates = [];

    for (const regex of dateRegexes) {
        const matches = text.match(regex);
        if (matches) {
            if (matches.length === 3) { // Month Day
                const month = matches[1];
                const day = parseInt(matches[2]);
                if (months.hasOwnProperty(month) && !isNaN(day)) {
                    dates.push(formatDate(new Date(new Date().getFullYear(), months[month] - 1, day)));
                }
            } else if (matches.length === 4) { // Month Day - Day
                const startMonth = matches[1];
                const startDay = parseInt(matches[2]);
                const endDay = parseInt(matches[3]);
                if (months.hasOwnProperty(startMonth) && !isNaN(startDay) && !isNaN(endDay)) {
                    for (let day = startDay; day <= endDay; day++) {
                        dates.push(formatDate(new Date(new Date().getFullYear(), months[startMonth] - 1, day)));
                    }
                }
            } else if (matches.length === 5) { // Month Day - Month Day
                const startMonth = matches[1];
                const startDay = parseInt(matches[2]);
                const endMonth = matches[3];
                const endDay = parseInt(matches[4]);
                if (months.hasOwnProperty(startMonth) && months.hasOwnProperty(endMonth) && !isNaN(startDay) && !isNaN(endDay)) {
                    const startDate = new Date(new Date().getFullYear(), months[startMonth] - 1, startDay);
                    const endDate = new Date(new Date().getFullYear(), months[endMonth] - 1, endDay);
                    let currentDate = new Date(startDate);
                    while (currentDate <= endDate) {
                        dates.push(formatDate(new Date(currentDate)));
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }
        }
    }

    return dates;
}

function formatDate(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[date.getMonth()] + " " + date.getDate();
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function washOutColor(rgb, washOutPercentage) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number); // Extract RGB components
    const [h, , l] = rgbToHsl(r, g, b); // Convert to HSL and keep only hue and lightness

    // Fixed saturation for all colors to ensure only hue affects the outcome
    const fixedSaturation = 1; // Adjust this value to control the saturation of the washed out color

    // Adjust lightness based on washOutPercentage; here, we assume a standard lightness for washed out effect
    const adjustedLightness = 0.5 + (washOutPercentage / 200); // Adjust this formula as needed

    // Convert the adjusted HSL back to RGB
    const [washedR, washedG, washedB] = hslToRgb(h, fixedSaturation, adjustedLightness);

    return `rgb(${washedR}, ${washedG}, ${washedB})`;
}



const modifyCalendar = function() {
    console.log('Attempting to modify the calendar...');
    const allDayEvents = document.querySelectorAll('.QGRmIf');
    const importantDates = new Map()

    allDayEvents.forEach(event => {
        document.querySelectorAll('.BiKU4b').forEach(dayColumn => dayColumn.style.backgroundColor = '');

        const eventText = event.querySelector('.ynRLnc').textContent;
        const parts = eventText.split(',').map(part => part.trim());

        // Extract the name and date
        const eventName = parts[1];

        // Extract the date(s) if manually colored from cell 5, if not cell 4.
        const eventDates = extractDates(parts[eventText.includes("Color:") ? 5 : 4]);

        if (eventName && eventName.startsWith('!')) {
            // Check if we successfully extracted a date
            if (eventDates.length > 0) {
                console.log(`Event dates extracted: ${eventDates.join(', ')}`);
                
                // Retrieve the background color directly from the style property
                const bgColor = event.style.backgroundColor;

                // Wash out the color
                const pastelColor = washOutColor(bgColor, 95);

                // Now, find the corresponding day column by the date
                eventDates.forEach(eventDate => importantDates.set(eventDate, pastelColor));
            } else {
                console.log('Could not extract the event dates.');
            }
        }
    });

    importantDates.forEach(function(color, date) {
        console.log(`important dates: ${date} - ${color}`);
        document.querySelectorAll('.BiKU4b').forEach(dayColumn => {
            const header = dayColumn.querySelector('h2.ynRLnc');
            if (header && header.textContent.includes(date)) {
                if (color === "none") dayColumn.style.backgroundColor = '';
                else dayColumn.style.backgroundColor = color;
            }
        });
    });
}; 




// MutationObserver setup remains the same

const observer = new MutationObserver(() => {
    console.log('Detected changes in the DOM.');
    modifyCalendar();
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('MutationObserver setup complete.');