<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';

  let chartContainer: HTMLElement;
  let chart: echarts.ECharts;

  // Reference points for vertical lines
  const refPoints = [
    { label: '-2σ', value: 15 },
    { label: '-σ', value: 35 },
    { label: 'mean', value: 50 },
    { label: '+σ', value: 70 },
    { label: '+2σ', value: 85 }
  ];

  // Dummy data for people (aggregate x-values)
  const people = [
    { name: 'A', color: '#6fcf97', x: 15 },
    { name: 'B', color: '#e0e0e0', x: 20 },
    { name: 'C', color: '#bb6bd9', x: 28 },
    { name: 'D', color: '#6fcf97', x: 38 },
    { name: 'E', color: '#f2994a', x: 40 },
    { name: 'F', color: '#2d9cdb', x: 52 },
    { name: 'G', color: '#f2994a', x: 54 },
    { name: 'H', color: '#6fcf97', x: 60 },
    { name: 'I', color: '#27ae60', x: 70 },
    { name: 'J', color: '#bb6bd9', x: 80 },
    { name: 'K', color: '#b7e4c7', x: 85 }
  ];

  onMount(() => {
    const option = {
      backgroundColor: '#222',
      grid: {
        top: '30%',
        bottom: '30%',
        left: 40,
        right: 40,
        containLabel: false
      },
      xAxis: {
        type: 'value',

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
        max: 2
      },
      series: [
        // Scatter points for people
        {
          type: 'scatter',
          data: people.map(p => [p.x, 1]),
          symbolSize: 40,
          itemStyle: {
            color: function(params: { dataIndex: number }) {
              return people[params.dataIndex].color;
            },
            borderColor: function(params: { dataIndex: number }) {
              return people[params.dataIndex].color;
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

    function updateGraphics() {
      const gridTop = chart.convertToPixel({gridIndex: 0}, [0, 2])[1];
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
    text-align: center;
  }
</style>
