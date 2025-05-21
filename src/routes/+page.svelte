<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import { get } from 'svelte/store';
  import { users, type User } from '../data/dummyData';
    import { Size } from '@tauri-apps/api/dpi';

  let chartContainer: HTMLElement;
  let chart: echarts.ECharts;
  let isJittered: boolean = false; // State for jitter effect

  function getAverageCommits(users: User[]): number{
    const commit_mean: number = users.reduce((acc, curr) => {
        return acc + curr.commits.length;
    }, 0) / users.length;

    return commit_mean;
  }


  function getRandomHexColor(): string {
    const randomColor = Math.floor(Math.random() * 0xffffff);
    return `#${randomColor.toString(16).padStart(6, '0')}`;
}

  function getUserCommits(users: User[]){
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
          const offset = (index - (users.length - 1) / 2) * 0.04; // 16px horizontal movement
          result.push({
            ...user,
            xOffset: offset
          });
        });
      }
    });

    return result;
  }

  const commit_mean = getAverageCommits(users);

  function getSD(users: User[]): number {
    let commits: number[] = [];

    // Get the list of total commits for each user
    users.forEach(user => {
      commits.push(user.commits.length);
    })

    // Creating the mean with Array.reduce
    const n: number = users.length;

    const variance: number = commits.reduce((acc: number, val: number) => acc + Math.pow(val - commit_mean, 2), 0) / n;
    
    const sd = Math.sqrt(variance);

    return sd;
  }

  const sd = getSD(users);

  // Calculate SD & Mean
  function getRefPoints() {

    const refPoints: number[] = [(commit_mean - (2 * sd)), (commit_mean - sd), commit_mean, (commit_mean + sd), (commit_mean + (2 * sd))]

    return refPoints
}
  
  const refPointValues: number[] = getRefPoints();

  // Reference points for vertical lines
  const refPoints = [
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

  onMount(() => {
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
        min: Math.ceil(commit_mean - (3 * sd)),
        max: Math.ceil(commit_mean + (3 * sd)),
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
        max: users.length + 1,
      },
      series: [
        {
          type: 'scatter',
          data: people.map(p => [p.numCommits + (p.xOffset || 0), 3]),
          symbolSize: 0,
          z: 3
        }
      ],
      graphic: []
    };

    chart = echarts.init(chartContainer);
    chart.setOption(option);

    //function to add jitter to the y-axis values
    function jitter(data: [number, number][]): [number, number][] {
      // Data is already sorted from getUserCommits
      const stepSize = 0.5; // Adjust this value to control the vertical spread
      
      return data.map(([numCommits, y], index) => {
        const heightOffset = index * stepSize;
        return [numCommits, y + heightOffset];
      });
    }

    //function to remove jitter from the y-axis values
    function unjitter(data: [number, number][]): [number, number][] {
      return data.map(([numCommits, y]) => {
        return [numCommits, 3]; // Return to base height 3
      });
    }

    // //onclick event to toggle jitter
    // chart.on('click', function (params) {
    //   isJittered = !isJittered;
    //   const newData = isJittered ? 
    //     jitter(people.map(p => [p.numCommits, 3])) :
    //     unjitter(people.map(p => [p.numCommits, 3]));
      
    //   chart.setOption({
    //     series: [{ data: newData }]
    //   });
    //   updateGraphics();
    // });

    function updateGraphics() {
      const gridTop = chart.convertToPixel({gridIndex: 0}, [0, users.length + 1])[1];
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
              y: gridTop - 10
            }
          ]
        };
      });

      // Create graphics for user images
      const userGraphics = people.map((person, index) => {
        const [x, y] = chart.convertToPixel({gridIndex: 0}, [person.numCommits + (person.xOffset || 0), 3]);
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
    }

    chart.on('finished', updateGraphics);
    window.addEventListener('resize', () => {
      chart.resize();
      updateGraphics();
    });


    return () => {
      window.removeEventListener('resize', updateGraphics);
      chart.dispose();
    };
  });
</script>

<main class="container">
  <h1 class="title">Overview Page</h1>
  <div bind:this={chartContainer} class="chart-container" style="width: 100%; height: 200px;"></div>
  <div class="cards-row">
    {#each people as person, i}
      <div class="profile-card">
        <img class="profile-avatar" src={(users.find(u => u.username === person.username)?.image || '').toString()} alt={person.username} />
        <div class="profile-info">
          <div class="profile-title">{person.username}</div>
          <div class="profile-subtitle">{person.numCommits} commits</div>
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
    align-items: center;
    background: var(--Fill-Tint-00, rgba(31, 31, 31, 0.90));
    border-radius: 12px;
    padding: 20px 28px;
    min-width: 320px;
    min-height: 70px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    gap: 18px;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
    background: #ccc;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }

  .profile-title {
    color: #fff;
    font-size: 18px;
    font-family: DM Sans, Inter, Arial, sans-serif;
    font-weight: 600;
    margin-bottom: 2px;
    text-align: left;
  }

  .profile-subtitle {
    color: #A3A3A3;
    font-size: 14px;
    font-family: DM Sans, Inter, Arial, sans-serif;
    font-weight: 400;
    text-align: left;
  }
</style>