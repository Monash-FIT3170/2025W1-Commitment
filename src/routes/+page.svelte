<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';

  let chartContainer: HTMLElement;
  let chart: echarts.ECharts;

  // DUMMY DATA SETUP -- REMOVE LATER 
  type Branch = Readonly<{
    commits: Commit[],
    dateRange: String
  }>

  type File = Readonly<{
    status: String,
    added: number,
    deleted: number,
    changed: number,
    path: String
  }>

  type Commit = Readonly<{
    date: String,
    time: String,
    branch: String,
    filesChanged: File[]
  }>

  type User = Readonly<{
    username: String,
    userEmails: String[],
    commits: Commit[]
  }>;

  // Dummy Data array - of users
  const users: User[] = [
  {
    username: "alice",
    userEmails: ["alice@example.com"],
    commits: [
      {
        date: "2025-05-01",
        time: "01:00 AM",
        branch: "feature/login",
        filesChanged: [
          { status: "modified", added: 10, deleted: 2, changed: 12, path: "src/auth.ts" }
        ]
      },
      {
        date: "2025-05-02",
        time: "02:00 PM",
        branch: "feature/login",
        filesChanged: [
          { status: "added", added: 50, deleted: 0, changed: 50, path: "src/components/LoginForm.tsx" }
        ]
      },
      {
        date: "2025-05-03",
        time: "03:00 AM",
        branch: "feature/dashboard",
        filesChanged: [
          { status: "deleted", added: 0, deleted: 30, changed: 30, path: "src/legacy.ts" }
        ]
      },
      {
        date: "2025-05-04",
        time: "04:00 PM",
        branch: "feature/dashboard",
        filesChanged: [
          { status: "modified", added: 5, deleted: 3, changed: 8, path: "src/dashboard.tsx" }
        ]
      },
      {
        date: "2025-05-05",
        time: "05:00 AM",
        branch: "hotfix/login-crash",
        filesChanged: [
          { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
        ]
      },
      {
        date: "2025-05-06",
        time: "06:00 PM",
        branch: "hotfix/login-crash",
        filesChanged: [
          { status: "modified", added: 2, deleted: 1, changed: 3, path: "src/auth.ts" }
        ]
      }
    ]
  },
  {
    username: "bob",
    userEmails: ["bob@example.com"],
    commits: [
      {
        date: "2025-05-01",
        time: "01:00 AM",
        branch: "feature/notifications",
        filesChanged: [
          { status: "added", added: 40, deleted: 0, changed: 40, path: "src/notifications.ts" }
        ]
      },
      {
        date: "2025-05-02",
        time: "02:00 PM",
        branch: "feature/notifications",
        filesChanged: [
          { status: "modified", added: 12, deleted: 4, changed: 16, path: "src/notifications.ts" }
        ]
      },
      {
        date: "2025-05-03",
        time: "03:00 AM",
        branch: "feature/settings",
        filesChanged: [
          { status: "added", added: 30, deleted: 0, changed: 30, path: "src/settings.ts" }
        ]
      },
      {
        date: "2025-05-04",
        time: "04:00 PM",
        branch: "feature/settings",
        filesChanged: [
          { status: "modified", added: 7, deleted: 2, changed: 9, path: "src/settings.ts" }
        ]
      },
      {
        date: "2025-05-05",
        time: "05:00 AM",
        branch: "hotfix/email-bug",
        filesChanged: [
          { status: "deleted", added: 0, deleted: 15, changed: 15, path: "src/email.ts" }
        ]
      }
    ]
  },
  {
    username: "carol",
    userEmails: ["carol@example.com"],
    commits: [
      {
        date: "2025-05-01",
        time: "01:00 PM",
        branch: "feature/profile",
        filesChanged: [
          { status: "added", added: 25, deleted: 0, changed: 25, path: "src/profile.ts" }
        ]
      },
      {
        date: "2025-05-02",
        time: "02:00 PM",
        branch: "feature/profile",
        filesChanged: [
          { status: "modified", added: 10, deleted: 5, changed: 15, path: "src/profile.ts" }
        ]
      },
      {
        date: "2025-05-03",
        time: "03:00 PM",
        branch: "feature/preferences",
        filesChanged: [
          { status: "added", added: 18, deleted: 0, changed: 18, path: "src/preferences.ts" }
        ]
      },
      {
        date: "2025-05-04",
        time: "04:00 PM",
        branch: "feature/preferences",
        filesChanged: [
          { status: "modified", added: 6, deleted: 2, changed: 8, path: "src/preferences.ts" }
        ]
      },
      {
        date: "2025-05-05",
        time: "05:00 PM",
        branch: "hotfix/profile-404",
        filesChanged: [
          { status: "modified", added: 2, deleted: 2, changed: 4, path: "src/profile.ts" }
        ]
      }
    ]
  },
  {
    username: "dave",
    userEmails: ["dave@example.com"],
    commits: [
      {
        date: "2025-05-01",
        time: "10:00 AM",
        branch: "feature/chat",
        filesChanged: [
          { status: "added", added: 100, deleted: 0, changed: 100, path: "src/chat.ts" }
        ]
      },
      {
        date: "2025-05-02",
        time: "11:00 AM",
        branch: "feature/chat",
        filesChanged: [
          { status: "modified", added: 15, deleted: 5, changed: 20, path: "src/chat.ts" }
        ]
      },
      {
        date: "2025-05-03",
        time: "12:00 PM",
        branch: "feature/chat-ui",
        filesChanged: [
          { status: "added", added: 60, deleted: 0, changed: 60, path: "src/components/ChatUI.tsx" }
        ]
      },
      {
        date: "2025-05-04",
        time: "01:00 PM",
        branch: "feature/chat-ui",
        filesChanged: [
          { status: "modified", added: 5, deleted: 3, changed: 8, path: "src/components/ChatUI.tsx" }
        ]
      },
      {
        date: "2025-05-05",
        time: "02:00 PM",
        branch: "hotfix/chat-scroll",
        filesChanged: [
          { status: "modified", added: 2, deleted: 1, changed: 3, path: "src/chat.ts" }
        ]
      }
    ]
  },
  {
    username: "eve",
    userEmails: ["eve@example.com"],
    commits: [
      {
        date: "2025-05-01",
        time: "09:00 AM",
        branch: "feature/security",
        filesChanged: [
          { status: "added", added: 80, deleted: 0, changed: 80, path: "src/security.ts" }
        ]
      },
      {
        date: "2025-05-02",
        time: "10:00 AM",
        branch: "feature/security",
        filesChanged: [
          { status: "modified", added: 8, deleted: 2, changed: 10, path: "src/security.ts" }
        ]
      },
      {
        date: "2025-05-03",
        time: "11:00 AM",
        branch: "feature/encryption",
        filesChanged: [
          { status: "added", added: 35, deleted: 0, changed: 35, path: "src/encryption.ts" }
        ]
      },
      {
        date: "2025-05-04",
        time: "12:00 PM",
        branch: "feature/encryption",
        filesChanged: [
          { status: "modified", added: 10, deleted: 1, changed: 11, path: "src/encryption.ts" }
        ]
      },
      {
        date: "2025-05-05",
        time: "01:00 PM",
        branch: "hotfix/security-alert",
        filesChanged: [
          { status: "deleted", added: 0, deleted: 5, changed: 5, path: "src/legacySecurity.ts" }
        ]
      },
      {
        date: "2025-05-06",
        time: "02:00 PM",
        branch: "hotfix/security-alert",
        filesChanged: [
          { status: "modified", added: 4, deleted: 0, changed: 4, path: "src/security.ts" }
        ]
      }
    ]
  }
];



  // Calculate SD & Mean
  

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
