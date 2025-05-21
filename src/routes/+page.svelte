<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import { get } from 'svelte/store';
  import { users, type User } from '../data/dummyData';

  let chartContainer: HTMLElement;
  let chart: echarts.ECharts;
  let hovermessage: string = '';    //temp to check hover event
  let onclickmessage: string = '';  //temp to check onclick event
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
        colour: getRandomHexColor(),
        numCommits: user.commits.length
      })
    })
    // Sort by number of commits
    return userTotalCommits.sort((a, b) => a.numCommits - b.numCommits);
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
        nameGap: 30,
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
        // Scatter points for people
        {
          type: 'scatter',
          data: people.map(p => [p.numCommits, 3]),
          symbolSize: 40,
          itemStyle: {
            color: function(params: { dataIndex: number }) {
              return people[params.dataIndex].colour;
            },
            borderColor: function(params: { dataIndex: number }) {
              return people[params.dataIndex].colour;
            },
            borderWidth: 4,
            shadowBlur: 0
          },
          label: {
            show: false
          },
          z: 3
        }
      ],
      graphic: [] // Will be set after chart is initialized
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


    //onclick event to show the user name and toggle jitter
    chart.on('click', function (params) {
      // if (params.componentType === 'scatter') { // This check might be too restrictive if we want to click anywhere on chart
        const i = params.dataIndex;
        // Update click message only if a data point was clicked
        if (params.componentType === 'series' && params.seriesType === 'scatter' && i !== undefined) {
            const person = people[i];
            onclickmessage = `Clicked on ${person.username}`;
        }

        isJittered = !isJittered; // Toggle jitter state

        if (isJittered) {
          const jitteredData = jitter(people.map(p => [p.numCommits, 3])); // Base Y for jitter is 3
          chart.setOption({
            series: [{ data: jitteredData }]
          });
          hovermessage = 'Jitter ON'; // Update hovermessage to reflect state
        } else {
          const unjitteredData = unjitter(people.map(p => [p.numCommits, 3])); // Base Y for unjitter is 3
          chart.setOption({
            series: [{ data: unjitteredData }]
          });
          hovermessage = 'Jitter OFF'; // Update hovermessage to reflect state
        }
      // }
    });


    function updateGraphics() {
      const gridTop = chart.convertToPixel({gridIndex: 0}, [0, users.length + 1])[1];
      const xAxisY = chart.convertToPixel({gridIndex: 0}, [0, 0])[1];
      const graphics = refPoints.map(ref => {
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
      chart.setOption({ graphic: graphics });
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
  <div bind:this={chartContainer} style="width: 100%; height: 200px;"></div>
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
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }
</style>
{#if hovermessage}
  <div class="hover-message">
    {hovermessage}
  </div>
{/if}
{#if onclickmessage}
  <div class="click-message">
    {onclickmessage}
  </div>
{/if}