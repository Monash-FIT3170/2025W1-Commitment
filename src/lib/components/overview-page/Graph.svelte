<script lang="ts">
    import { Chart } from "svelte-echarts";
    import { init, use, util as eUtils } from "echarts/core";
    import { ScatterChart } from "echarts/charts";
    import {
        get_average_commits,
        get_sd,
        get_ref_points,
        type Contributor,
    } from "../../metrics";
    import { GridComponent, TitleComponent } from "echarts/components";
    import { CanvasRenderer } from "echarts/renderers";
    import { info } from "@tauri-apps/plugin-log";

    let { contributors }: { contributors: Contributor[] } = $props();

    type User = Readonly<{
        contributor: Contributor;
        offsetIndex: number;
    }>;

    // Reactive declarations for derived values
    let commit_mean = $state(get_average_commits(contributors));
    let sd = $state(get_sd(contributors));
    let ref_point_values = $derived(get_ref_points(commit_mean, sd));

    // Reference points for vertical lines
    let ref_points = $derived(
        sd === 0
            ? [{ label: "mean", value: ref_point_values[2] }]
            : [
                  { label: "-2σ", value: ref_point_values[0] },
                  { label: "-σ", value: ref_point_values[1] },
                  { label: "mean", value: ref_point_values[2] },
                  { label: "+σ", value: ref_point_values[3] },
                  { label: "+2σ", value: ref_point_values[4] },
              ],
    );

    type min_max = Readonly<{
        min: number;
        max: number;
    }>;

    // Calculate min and max number of commits for filteredPeople
    let { min: min_commits_x, max: max_commits_x } = contributors.reduce(
        (a: min_max, p: Contributor) => {
            return {
                min: Math.min(a.min, p.total_commits),
                max: Math.max(a.max, p.total_commits),
            };
        },
        { min: Infinity, max: 1 },
    );

    use([ScatterChart, GridComponent, CanvasRenderer, TitleComponent]);

    let commit_data = $derived(
        contributors.map((p: Contributor) => [p.total_commits, 1]),
    );

    let contributor_data = $derived(
        contributors.map((p: Contributor) => [
            p.total_commits,
            1,
            p.author.login,
        ]),
    );

    let options = $derived({
        grid: {
            top: "10%",
            bottom: "25%",
            left: 40,
            right: 40,
            containLabel: false,
        },
        xAxis: {
            type: "value",
            min: min_commits_x,
            max: max_commits_x,
            name: "Total Commits",
            nameGap: 40,
            nameLocation: "middle",
            position: "bottom",
            axisLine: {
                lineStyle: {
                    color: "#fff",
                    width: 2,
                },
            },
            axisLabel: {
                color: "#fff",
                fontSize: 16,
                margin: 16,
            },
            splitLine: { show: false },
            axisTick: {
                lineStyle: {
                    color: "#fff",
                    width: 2,
                },
            },
        },
        yAxis: {
            show: false,
            min: 0,
            max: 2,
        },
        series: [
            {
                type: "scatter",
                data: commit_data,
                symbolSize: 32,
                z: 3,
                markLine: {
                    silent: true,
                    data: [
                        {
                            type: "average",
                            name: "mean",
                            indexValue: 0,
                            lineStyle: {
                                color: "#fff",
                                width: 20,
                                type: "dashed",
                            },
                        },
                    ],
                },
            },
            {
                name: "hover_points",
                type: "scatter",
                data: contributor_data,
                symbolSize: 32,
                z: 0,
                itemStyle: {
                    color: "transparent",
                },
                emphasis: {
                    focus: "series",
                    itemStyle: {
                        color: "transparent",
                        borderColor: "#fff",
                        borderWidth: 2,
                        shadowBlur: 10,
                        shadowColor: "rgba(255, 255, 255, 0.7)",
                    },
                },
            },
        ],
        tooltip: {
            trigger: "item",
            formatter: function (params: any) {
                if (params.seriesName === "hover_points") {
                    const username = params.data[2];
                    const person = contributors.find(
                        (p) => p.author.login === username,
                    );
                    if (!person) return username;
                    return `
              <div style="text-align: left;">
                <strong>${username}</strong><br/>
                Total Commits: ${params.data[0]}
              </div>
            `;
                }

                return "";
            },
        },
    });
</script>

<div class="app">
    <Chart {init} {options} />
</div>

<style>
    .app {
        width: 90vw;
        height: 90vh;
    }
</style>
