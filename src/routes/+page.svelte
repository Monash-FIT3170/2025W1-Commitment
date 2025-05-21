<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import { get } from 'svelte/store';
  import { users, type User } from '../data/dummyData';
  import { Size } from '@tauri-apps/api/dpi';

  let chartContainer: HTMLElement;
  let chart: echarts.ECharts;
  let isJittered: boolean = false; // State for jitter effect

  // Add branch selection state
  let selectedBranch = 'all';
  
  // Extract unique branches from dummy data and add 'all' option
  const branches = ['all', ...new Set(users.flatMap(user => 
    user.commits.map(commit => commit.branch)
  ))];

  // Filter users based on selected branch
  $: filteredUsers = selectedBranch === 'all' 
    ? users 
    : users.map(user => ({
        ...user,
        commits: user.commits.filter(commit => commit.branch === selectedBranch)
      })).filter(user => user.commits.length > 0);

  function getAverageCommits(users: User[]): number {
    if (users.length === 0) return 0;
    const commit_mean: number = users.reduce((acc, curr) => {
        return acc + curr.commits.length;
    }, 0) / users.length;

    return commit_mean;
  }

  function getSD(users: User[]): number {
    if (users.length === 0) return 0;
    let commits: number[] = [];

    // Get the list of total commits for each user
    users.forEach(user => {
      commits.push(user.commits.length);
    })

    // Creating the mean with Array.reduce
    const n: number = users.length;
    const mean = getAverageCommits(users);

    const variance: number = commits.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / n;
    
    return Math.sqrt(variance);
  }

  // Calculate SD & Mean
  function getRefPoints(mean: number, sd: number): number[] {
    if (sd === 0) return [mean, mean, mean, mean, mean];
    return [
      (mean - (2 * sd)),
      (mean - sd),
      mean,
      (mean + sd),
      (mean + (2 * sd))
    ];
  }

  function getRandomHexColor(): string {
    const randomColor = Math.floor(Math.random() * 0xffffff);
    return `#${randomColor.toString(16).padStart(6, '0')}`;
}

  function getUserCommits(users: User[]) {
    if (users.length === 0) return [];
    let userTotalCommits: any[] = [];
    users.forEach(user => { 
      userTotalCommits.push({
        username: user.username,
        image: user.image,
        numCommits: user.commits.length
      })
    })
    // Sort by number of commits
    const sortedCommits = userTotalCommits.sort((a, b) => a.numCommits - b.numCommits);
    
    // Group by numCommits and apply horizontal offset
    const groups = new Map<number, any[]>();
    sortedCommits.forEach(user => {
      if (!groups.has(user.numCommits)) {
        groups.set(user.numCommits, []);
      }
      groups.get(user.numCommits)!.push(user);
    });

    // Apply horizontal offset to overlapping points
    const result: any[] = [];
    groups.forEach((users, commits) => {
      if (users.length === 1) {
        result.push(users[0]);
      } else {
        users.forEach((user, index) => {
          result.push({
            ...user,
            offsetIndex: index - (users.length - 1) / 2
          });
        });
      }
    });

    return result;
  }

  // Reactive declarations for derived values
  $: commit_mean = getAverageCommits(filteredUsers);
  $: sd = getSD(filteredUsers);
  $: refPointValues = getRefPoints(commit_mean, sd);
  $: filteredPeople = getUserCommits(filteredUsers);

  // Reference points for vertical lines
  $: refPoints = (sd === 0)
    ? [{ label: 'mean', value: refPointValues[2] }]
    : [
        { label: '-2σ', value: refPointValues[0] },
        { label: '-σ', value: refPointValues[1] },
        { label: 'mean', value: refPointValues[2] },
        { label: '+σ', value: refPointValues[3] },
        { label: '+2σ', value: refPointValues[4] }
      ];

  // Dummy data for people (aggregate x-values)
  const people = getUserCommits(users);
  
  // [
  //   { name: 'A', color: '#6fcf97', x: 15 },
  //   { name: 'B', color: '#e0e0e0', x: 20 },
  //   { name: 'C', color: '#bb6bd9', x: 28 },
  //   { name: 'D', color: '#6fcf97', x: 38 },
  //   { name: 'E', color: '#f2994a', x: 40 },
  //   { name: 'F', color: '#2d9cdb', x: 52 },
  //   { name: 'G', color: '#f2994a', x: 54 },
  //   { name: 'H', color: '#6fcf97', x: 60 },
  //   { name: 'I', color: '#27ae60', x: 70 },
  //   { name: 'J', color: '#bb6bd9', x: 80 },
  //   { name: 'K', color: '#b7e4c7', x: 85 }
  // ];

  function updateGraphics() {
    if (!chart) return;
    
    // Use y=2 as the top of the y-axis for gridTop
    const gridTop = chart.convertToPixel({gridIndex: 0}, [0, 2])[1];
    const xAxisY = chart.convertToPixel({gridIndex: 0}, [0, 0])[1];
    
    // Create graphics for reference lines
    const refLineGraphics = refPoints.map(ref => {
      const x = chart.convertToPixel({gridIndex: 0}, [ref.value, 0])[0];
      return {
        type: 'group',
        children: [
          {
            type: 'line',
            shape: {
              x1: x,
              y1: gridTop,
              x2: x,
              y2: xAxisY
            },
            style: {
              stroke: '#fff',
              lineDash: [4, 4],
              lineWidth: 1,
              opacity: 0.5
            },
            silent: true
          },
          {
            type: 'text',
            style: {
              text: ref.label,
              fontSize: 12,
              fill: '#fff',
              font: 'bold 16px sans-serif',
              textAlign: 'center',
              textVerticalAlign: 'bottom'
            },
            x: x,
            y: gridTop - 8 
          }
        ]
      };
    });

    // Create graphics for user images with fixed pixel offset
    const userGraphics = filteredPeople.map((person) => {
      // Convert the base position to pixels
      const [baseX, y] = chart.convertToPixel({gridIndex: 0}, [person.numCommits, 1]);
      // Apply fixed 16px offset if there's an offsetIndex
      const x = baseX + (person.offsetIndex ? person.offsetIndex * 16 : 0);
      
      return {
        type: 'group',
        children: [
          {
            type: 'image',
            style: {
              image: person.image,
              width: 40,
              height: 40
            },
            x: x - 20, // Center the image
            y: y - 20, // Center the image
            silent: false,
            clipPath: {
              type: 'circle',
              shape: {
                cx: 20,
                cy: 20,
                r: 20
              }
            }
          }
        ]
      };
    });

    // Combine all graphics
    chart.setOption({ 
      graphic: [...refLineGraphics, ...userGraphics]
    });

    console.log(filteredPeople);
  }

  // Calculate min and max number of commits for filteredPeople
  $: minCommits = filteredPeople.length > 0 ? Math.min(...filteredPeople.map(p => p.numCommits)) : 0;
  $: maxCommits = filteredPeople.length > 0 ? Math.max(...filteredPeople.map(p => p.numCommits)) : 1;
  $: xMin = minCommits === maxCommits ? minCommits - 1 : minCommits - 1;
  $: xMax = minCommits === maxCommits ? maxCommits + 1 : maxCommits + 1;

  // Update the chart config to use xMin and xMax
  $: if (chart && selectedBranch) {
    const option = {
      backgroundColor: '#222',
      grid: {
        top: '10%',
        bottom: '25%',
        left: 40,
        right: 40,
        containLabel: false
      },
      xAxis: {
        type: 'value',
        min: xMin,
        max: xMax,
        name: 'Total Commits',
        nameLocation: 'middle',
        nameGap: 40,
        axisLine: {
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        axisLabel: {
          color: '#fff',
          fontSize: 16,
          margin: 16
        },
        splitLine: { show: false },
        axisTick: {
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        position: 'bottom'
      },
      yAxis: {
        show: false,
        min: 0,
        max: 2,
      },
      series: [
        {
          type: 'scatter',
          data: filteredPeople.map(p => [p.numCommits, 1]),
          symbolSize: 0,
          z: 3
        }
      ],
      graphic: []
    };

    chart.setOption(option, true); // true for not merging with previous options
    updateGraphics();
  }

  onMount(() => {
    chart = echarts.init(chartContainer);
    
    window.addEventListener('resize', () => {
      chart.resize();
      updateGraphics();
    });

    return () => {
      window.removeEventListener('resize', updateGraphics);
      chart.dispose();
    };
  });

  // 1. Total Commits for a user
  function getUserTotalCommits(user: User): number {
    return user.commits.length;
  }

  // 2. Total Lines of Code (additions + deletions) for a user
  function getUserTotalLinesOfCode(user: User): number {
    return user.commits.reduce((commitAcc, commit) =>
      commitAcc + commit.filesChanged.reduce((fileAcc, file) =>
        fileAcc + file.added + file.deleted, 0
      ), 0
    );
  }

  // 3. Lines per Commit for a user
  function getUserLinesPerCommit(user: User): number {
    const totalCommits = getUserTotalCommits(user);
    const totalLines = getUserTotalLinesOfCode(user);
    return totalCommits === 0 ? 0 : Math.round(totalLines / totalCommits);
  }

  // 4. Commits per Day for a user
  function getUserCommitsPerDay(user: User): number {
    const allDates = user.commits.map(commit => commit.date);
    const uniqueDates = new Set(allDates);
    const totalCommits = getUserTotalCommits(user);
    return uniqueDates.size === 0 ? 0 : +(totalCommits / uniqueDates.size).toFixed(2);
  }

  // 5. Total Additions for a user
  function getUserTotalAdditions(user: User): number {
    return user.commits.reduce((commitAcc, commit) =>
      commitAcc + commit.filesChanged.reduce((fileAcc, file) =>
        fileAcc + file.added, 0
      ), 0
    );
  }

  // 6. Total Deletions for a user
  function getUserTotalDeletions(user: User): number {
    return user.commits.reduce((commitAcc, commit) =>
      commitAcc + commit.filesChanged.reduce((fileAcc, file) =>
        fileAcc + file.deleted, 0
      ), 0
    );
  }

  // Add this function after the other utility functions
  function calculateScalingFactor(numCommits: number): number {
    if (sd === 0) return 1.0;
    const zScore = (numCommits - commit_mean) / sd;
    const EPSILON = 1e-6;
    if (Math.abs(zScore) < EPSILON) {
      return 1.0;
    } else if (Math.abs(zScore) <= 1) {
      return 1.0;
    } else if (zScore < -1 && zScore >= -2) {
      return 0.9;
    } else if (zScore > 1 && zScore <= 2) {
      return 1.1;
    } else {
      return zScore < 0 ? 0.8 : 1.2;
    }
  }

  // Update the peopleWithMetrics to use filteredUsers
  $: peopleWithMetrics = filteredPeople.map(person => {
    const user = filteredUsers.find(u => u.username === person.username);
    const scalingFactor = calculateScalingFactor(person.numCommits);
    return {
      ...person,
      totalLinesOfCode: user ? getUserTotalLinesOfCode(user) : 0,
      linesPerCommit: user ? getUserLinesPerCommit(user) : 0,
      commitsPerDay: user ? getUserCommitsPerDay(user) : 0,
      totalAdditions: user ? getUserTotalAdditions(user) : 0,
      totalDeletions: user ? getUserTotalDeletions(user) : 0,
      scalingFactor: scalingFactor.toFixed(1)
    };
  });
</script>

<main class="container">
  <div class="header-row">
    <h1 class="title">Overview Page</h1>
    <select 
      bind:value={selectedBranch} 
      class="branch-select"
    >
      {#each branches as branch}
        <option value={branch}>{branch === 'all' ? 'All Branches' : branch}</option>
      {/each}
    </select>
  </div>
  <div bind:this={chartContainer} class="chart-container" style="width: 100%; height: 200px;"></div>
  <div class="cards-row">
    {#each peopleWithMetrics as person, i}
      <div class="profile-card">
        <div class="profile-header-row">
          <img class="profile-avatar" src={person.image} alt={person.username} />
          <div class="profile-header-main">
            <div class="profile-header-info">
              <div class="profile-title">{person.username}</div>
              <div class="profile-scaling">scaling: {person.scalingFactor}</div>
            </div>
            <div class="profile-metrics-main">
              <div class="profile-metrics-row">
                <span>{person.numCommits} commits</span>
                <span class="metrics-separator">&nbsp;&nbsp;</span>
                <span>{person.totalLinesOfCode} lines of code</span>
              </div>
              <div class="profile-metrics-row">
                <span>{person.linesPerCommit} lines/commit</span>
                <span class="metrics-separator">&nbsp;&nbsp;</span>
                <span>{person.commitsPerDay} commits/day</span>
              </div>
              <div class="profile-metrics-row">
                <span class="metrics-additions">{person.totalAdditions}++ additions</span>
                <span class="metrics-separator">&nbsp;&nbsp;</span>
                <span class="metrics-deletions">{person.totalDeletions}-- deletions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</main>

<style>
  :root {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: #f6f6f6;
    background-color: #222;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
  }
  .container {
    margin: 0;
    padding: 1rem 2rem;  /* Reset to normal padding */
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: auto;
  }
  .title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 2rem;
    color: #f6f6f6;
  }
  .chart-container {
    margin-top: 10rem;  /* Add margin to push the chart down */
  }
  .cards-row {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
    margin-top: 3rem;
  }

  .profile-card {
    display: flex;
    flex-direction: column;
    background: var(--Fill-Tint-00, rgba(31, 31, 31, 0.90));
    border-radius: 12px;
    padding: 20px 28px;
    min-width: 320px;
    min-height: 70px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .profile-header-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 0;
  }

  .profile-header-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
  }

  .profile-header-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1px;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
    background: #ccc;
  }

  .profile-title {
    color: #fff;
    font-size: 18px;
    font-family: DM Sans, Inter, Arial, sans-serif;
    font-weight: 600;
    margin-bottom: 2px;
    text-align: left;
  }

  .profile-scaling {
    color: #A3A3A3;
    font-size: 14px;
    font-family: DM Sans, Inter, Arial, sans-serif;
    font-weight: 400;
    text-align: left;
    margin-bottom: 8px;
  }

  .profile-metrics-main {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .profile-metrics-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 15px;
    color: #ccc;
    margin-bottom: 2px;
    font-family: DM Sans, Inter, Arial, sans-serif;
  }

  .metrics-separator {
    width: 16px;
    display: inline-block;
  }

  .metrics-additions {
    color: #4ade80;
    font-weight: bold;
  }

  .metrics-deletions {
    color: #fb7185;
    font-weight: bold;
  }

  .header-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .branch-select {
    background-color: #333;
    color: #f6f6f6;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }

  .branch-select:hover {
    border-color: #666;
  }

  .branch-select:focus {
    border-color: #888;
  }
</style>