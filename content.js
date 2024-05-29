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
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
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

  if (s === 0) {
      r = g = b = l; // achromatic
  } else {
      const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      };

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
  const [h, s, l] = rgbToHsl(r, g, b); // Convert to HSL

  // Increase the lightness
  const newL = Math.min(1, l + (1 - l) * (washOutPercentage / 100));

  const [washedR, washedG, washedB] = hslToRgb(h, s, newL);

  return `rgb(${washedR}, ${washedG}, ${washedB})`;
}

const modifyCalendar = function() {
    console.log('Attempting to modify the calendar...');
    const allDayEvents = document.querySelectorAll('.vEJ0bc.elYzab-cXXICe-Hjleke.NlL62b'); // Updated selector
    const importantDates = new Map();

    document.querySelectorAll('.BiKU4b').forEach(dayColumn => dayColumn.style.backgroundColor = ''); // Reset background colors

    allDayEvents.forEach(event => {
        console.log('Processing event:', event);

        // Find the event text element within the event
        const eventTextElement = event.querySelector('.XuJrye'); // Updated selector
        if (!eventTextElement) {
            console.log('No text element found for event:', event);
            return;
        }

        const eventText = eventTextElement.textContent;
        console.log('Event text:', eventText);

        // Extract the name and date
        const parts = eventText.split(',').map(part => part.trim());
        const eventName = parts[1];
        const eventDates = extractDates(eventText);

        if (eventName && eventName.startsWith('!')) {
            // Check if we successfully extracted a date
            if (eventDates.length > 0) {
                console.log(`Event dates extracted: ${eventDates.join(', ')}`);

              // Find the color element within the event
              let bgColor = null;
              const colorElement = event.querySelector('.KF4T6b.jKgTF');
              if (colorElement) {
                  bgColor = window.getComputedStyle(colorElement).backgroundColor;
              } else {
                  console.log('No color found for event:', event);
                  return;
              }

                if (!bgColor) {
                    console.log('No color found for event:', event);
                    return;
                }

                console.log('Event background color:', bgColor);

                // Wash out the color
                const pastelColor = washOutColor(bgColor, 85);
                console.log('Washed out color:', pastelColor);

                // Now, find the corresponding day column by the date
                eventDates.forEach(eventDate => importantDates.set(eventDate, pastelColor));
            } else {
                console.log('Could not extract the event dates.');
            }
        }
    });

    importantDates.forEach(function(color, date) {
        console.log(`Highlighting important date: ${date} - ${color}`);
        document.querySelectorAll('.BiKU4b').forEach(dayColumn => {
            const header = dayColumn.querySelector('h2');
            if (header && header.textContent.includes(date)) {
                if (color === "none") dayColumn.style.backgroundColor = '';
                else dayColumn.style.backgroundColor = color;
                console.log(`Applied color ${color} to date ${date}`);
            } else {
                console.log(`Date header not found for date: ${date}`);
            }
        });
    });
};

const observer = new MutationObserver(() => {
    console.log('Detected changes in the DOM.');
    modifyCalendar();
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('MutationObserver setup complete.');