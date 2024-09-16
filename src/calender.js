document.addEventListener('DOMContentLoaded', () => {
  const leetcodeApiUrl = 'https://cp-contest-api.vercel.app/leetcode';
  const codeforcesApiUrl = 'https://cp-contest-api.vercel.app/codeforces';
  const codechefApiUrl = 'https://cp-contest-api.vercel.app/codechef';
  const leetcodeBaseUrl = 'https://leetcode.com/contest';
  const codechefBaseUrl = 'https://www.codechef.com/contests';
  const contestListElement = document.getElementById('contestList');

  // Function to fetch data from an API
  const fetchData = (url) => {
    return fetch(url)
      .then(response => response.json())
      .catch(error => {
        console.error(`Error fetching data from ${url}:`, error);
        return []; // Return an empty array in case of error
      });
  };

  // Function to format date in xx-Month-yyyy format
  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Function to format time range
  const formatTimeRange = (startTime, endTime) => {
    return `${new Date(startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  // Function to create Google Calendar event URL
  const createCalendarUrl = (title, startTime, endTime) => {
    const startDate = new Date(startTime).toISOString().replace(/[-:.]/g, '').slice(0, 15);
    const endDate = new Date(endTime).toISOString().replace(/[-:.]/g, '').slice(0, 15);
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}`;
    return calendarUrl;
  };

  // Function to sort contests by start time
  const sortContests = (contests) => {
    return contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  // Fetch data from all three APIs
  Promise.all([
    fetchData(leetcodeApiUrl),
    fetchData(codeforcesApiUrl),
    fetchData(codechefApiUrl)
  ])
  .then(([leetcodeData, codeforcesData, codechefData]) => {
    // Flatten the structure of combined data to access all contest arrays
    const combinedData = [
      ...leetcodeData.map(contest => ({
        title: contest.title,
        site: 'LeetCode',
        startTime: contest.startTime,
        endTime: contest.endTime,
        url: contest.url || leetcodeBaseUrl
      })),
      ...codeforcesData.map(contest => ({
        title: contest.title,
        site: 'Codeforces',
        startTime: contest.startTime,
        endTime: contest.endTime,
        url: contest.url
      })),
      ...codechefData.future_contests.map(contest => ({
        title: contest.contest_name,
        site: 'CodeChef',
        startTime: contest.contest_start_date,
        endTime: contest.contest_end_date,
        url: contest.contest_url || codechefBaseUrl
      }))
    ];

    // Sort contests by start time
    const sortedData = sortContests(combinedData);

    // Clear existing contests
    contestListElement.innerHTML = '';

    // Display the sorted data
    sortedData.forEach(contest => {
      const listItem = document.createElement('li');
      listItem.className = 'contest-item';

      // Create link for contest title
      const title = document.createElement('a');
      title.className = 'contest-title';
      title.textContent = contest.title;
      title.href = contest.url || '#'; // Use '#' if URL is not available
      title.target = '_blank'; // Open in a new tab

      // Create a container for date, time, and Notify button
      const dateTimeBox = document.createElement('div');
      dateTimeBox.className = 'date-time-box';

      // Create a container for date and time
      const dateTimeDetails = document.createElement('div');
      dateTimeDetails.className = 'date-time-details';

      const date = document.createElement('span');
      date.className = 'contest-date';
      date.textContent = formatDate(contest.startTime); // Display date in xx-Month-yyyy format

      const timeRange = document.createElement('p');
      timeRange.className = 'contest-times';
      timeRange.textContent = formatTimeRange(contest.startTime, contest.endTime); // Display time range

      const notifyButton = document.createElement('a');
      notifyButton.className = 'notify-button';
      notifyButton.textContent = 'Notify';
      notifyButton.href = createCalendarUrl(contest.title, contest.startTime, contest.endTime); // Google Calendar URL
      notifyButton.target = '_blank'; // Open in a new tab

      dateTimeDetails.appendChild(date);
      dateTimeDetails.appendChild(timeRange);
      dateTimeBox.appendChild(dateTimeDetails);
      dateTimeBox.appendChild(notifyButton); // Add Notify button to dateTimeBox

      listItem.appendChild(title);
      listItem.appendChild(dateTimeBox);
      contestListElement.appendChild(listItem);
    });
  })
  .catch(error => {
    console.error('Error processing contest data:', error);
  });
});
